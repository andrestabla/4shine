'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB4_V3_CONFIG } from '@/lib/workbooks-v2-wb4'

export function WB4Digital() {
    return <WorkbookV3Runtime config={WB4_V3_CONFIG} />
}
