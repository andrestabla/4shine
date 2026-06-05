import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/server/auth/request-auth'
import { withClient, withRoleContext } from '@/server/db/pool'
import { listLeaderSummaries } from '@/features/lideres/summary-service'
import { errorResponse, unauthorizedResponse } from '../../_utils'

export const runtime = 'nodejs'

export async function GET(request: Request) {
    const identity = await authenticateRequest(request)
    if (!identity) return unauthorizedResponse()

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                return listLeaderSummaries(client, identity)
            }),
        )
        return NextResponse.json({ ok: true, data }, { status: 200 })
    } catch (error) {
        return errorResponse(error, 'No se pudo cargar el resumen de líderes')
    }
}
