'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB8_V3_CONFIG } from '@/lib/workbooks-v2-wb8'

export function WB8Digital() {
    return <WorkbookV3Runtime config={WB8_V3_CONFIG} />
}
