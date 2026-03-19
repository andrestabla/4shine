'use client'

import { WorkbookStructuredDigital } from '@/components/workbooks-v2/WorkbookStructuredDigital'
import { WB9_STRUCTURED_CONFIG } from '@/lib/workbooks-v2-structured'

export function WB9Digital() {
    return <WorkbookStructuredDigital config={WB9_STRUCTURED_CONFIG} />
}
