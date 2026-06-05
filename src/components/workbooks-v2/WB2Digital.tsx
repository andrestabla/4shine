'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB2_V3_CONFIG } from '@/lib/workbooks-v2-wb2'

export function WB2Digital() {
    return <WorkbookV3Runtime config={WB2_V3_CONFIG} />
}
