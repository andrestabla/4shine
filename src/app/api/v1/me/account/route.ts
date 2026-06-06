import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticateRequest } from '@/server/auth/request-auth'
import { withClient, withRoleContext } from '@/server/db/pool'
import { deleteOwnAccount } from '@/features/usuarios/service'
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../modules/_utils'

export const runtime = 'nodejs'

/**
 * El propio usuario solicita la baja completa de su cuenta. Borra toda
 * la información asociada (igual cascada que el flujo admin) y limpia
 * las cookies de sesión para forzar logout inmediato.
 */
export async function DELETE(request: Request) {
    const identity = await authenticateRequest(request)
    if (!identity) return unauthorizedResponse()

    try {
        const result = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const data = await deleteOwnAccount(client, identity)
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'usuarios',
                    action: 'self_delete_account',
                    entityTable: 'app_core.users',
                    entityId: identity.userId,
                    changeSummary: { reason: 'user_initiated_deletion' },
                })
                return data
            }),
        )

        const response = NextResponse.json({ ok: true, data: result }, { status: 200 })
        // Limpiar cookies de sesión (logout instantáneo)
        const cookieStore = await cookies()
        const cookieNames = ['app_session', 'app_csrf', 'app_refresh']
        for (const name of cookieNames) {
            if (cookieStore.has(name)) {
                response.cookies.set(name, '', { maxAge: 0, path: '/' })
            }
        }
        return response
    } catch (error) {
        return errorResponse(error, 'No se pudo eliminar la cuenta')
    }
}
