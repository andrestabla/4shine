'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB10_V3_CONFIG } from '@/lib/workbooks-v2-wb10'

export function WB10Digital() {
    return <WorkbookV3Runtime config={WB10_V3_CONFIG} />
}
