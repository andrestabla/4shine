'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB7_V3_CONFIG } from '@/lib/workbooks-v2-wb7'

export function WB7Digital() {
    return <WorkbookV3Runtime config={WB7_V3_CONFIG} />
}
