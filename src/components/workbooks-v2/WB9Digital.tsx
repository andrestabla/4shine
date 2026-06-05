'use client'

import { WorkbookV3Runtime } from '@/components/workbooks-v2/WB1V3Runtime'
import { WB9_V3_CONFIG } from '@/lib/workbooks-v2-wb9'

export function WB9Digital() {
    return <WorkbookV3Runtime config={WB9_V3_CONFIG} />
}
