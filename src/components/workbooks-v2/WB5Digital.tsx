'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB5_V3_CONFIG } from '@/lib/workbooks-v2-wb5'

export function WB5Digital() {
    return <WorkbookV3Runtime config={WB5_V3_CONFIG} />
}
