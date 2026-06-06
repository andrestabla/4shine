import { NextResponse, after } from 'next/server'
import { authenticateRequest } from '@/server/auth/request-auth'
import { withClient, withRoleContext } from '@/server/db/pool'
import { markDiscoveryStartedByActor } from '@/features/descubrimiento/service'
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils'

export const runtime = 'nodejs'

/**
 * Marca el diagnóstico como iniciado y dispara el correo a admin/gestores.
 * Sólo el líder dueño puede invocarlo; idempotente.
 *
 * El UI lo llama justo al hacer clic en "Empezar diagnóstico".
 */
export async function POST(request: Request) {
    const identity = await authenticateRequest(request)
    if (!identity) return unauthorizedResponse()

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await markDiscoveryStartedByActor(client, identity)
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'descubrimiento',
                    action: 'discovery_started_by_user',
                    entityTable: 'app_assessment.discovery_sessions',
                    changeSummary: { alerted: result.alerted },
                })
                return result
            }),
        )

        // El correo viaja en background tras devolver la respuesta — el
        // INSERT del flag ya ocurrió dentro del withClient (transaction
        // ya cerrada). Cualquier fallo de SMTP queda logueado pero no
        // bloquea al líder.
        if (data.alerted) {
            after(() => {
                // markDiscoveryStartedByActor ya disparó el dispatch dentro
                // de la transacción del cliente principal; el `after` aquí
                // queda como hook para futuros reintentos si los hubiera.
            })
        }

        return NextResponse.json({ ok: true, data }, { status: 200 })
    } catch (error) {
        return errorResponse(error, 'No se pudo marcar el diagnóstico como iniciado')
    }
}
