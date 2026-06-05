'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB1_V3_CONFIG } from '@/lib/workbooks-v2-wb1'

export function WB1Step1Digital() {
    return <WorkbookV3Runtime config={WB1_V3_CONFIG} />
}
