'use client'

import { WorkbookStructuredDigital } from '@/components/workbooks-v2/WorkbookStructuredDigital'
import { WB10_STRUCTURED_CONFIG } from '@/lib/workbooks-v2-structured'

export function WB10Digital() {
    return <WorkbookStructuredDigital config={WB10_STRUCTURED_CONFIG} />
}
