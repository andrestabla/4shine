'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB3_V3_CONFIG } from '@/lib/workbooks-v2-wb3'

export function WB3Digital() {
    return <WorkbookV3Runtime config={WB3_V3_CONFIG} />
}
