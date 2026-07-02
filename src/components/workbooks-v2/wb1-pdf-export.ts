'use client'

import type { jsPDF } from 'jspdf'
import { formatDate } from '@/lib/format-date'
import type { WB1Config, WB1Field, WB1Group, WB1Section } from '@/lib/workbooks-v2-wb1'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 18
const CONTENT_W = PAGE_W - MARGIN * 2

type WB1ValueShape = {
    text: string
    audioUrl?: string
    audioDurationMs?: number
    aiGenerated?: boolean
}

type WriterCtx = {
    pdf: jsPDF
    y: number
}

function sanitizeName(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
}

function newPage(ctx: WriterCtx) {
    ctx.pdf.addPage()
    ctx.y = MARGIN
}

function ensureSpace(ctx: WriterCtx, required: number) {
    if (ctx.y + required > PAGE_H - MARGIN) newPage(ctx)
}

function writeParagraph(ctx: WriterCtx, text: string, options?: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number }) {
    if (!text) return
    const size = options?.size ?? 10
    const bold = options?.bold ?? false
    const color = options?.color ?? [30, 41, 59]
    const gap = options?.gap ?? 2

    ctx.pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    ctx.pdf.setFontSize(size)
    ctx.pdf.setTextColor(color[0], color[1], color[2])

    const lines = ctx.pdf.splitTextToSize(text, CONTENT_W) as string[]
    const lineHeight = size * 0.45 + 0.5

    for (const line of lines) {
        ensureSpace(ctx, lineHeight)
        ctx.pdf.text(line, MARGIN, ctx.y)
        ctx.y += lineHeight
    }
    ctx.y += gap
}

function writeFieldCard(ctx: WriterCtx, field: WB1Field, value: WB1ValueShape | undefined) {
    const text = value?.text?.trim()
    if (!text) return

    ctx.pdf.setFont('helvetica', 'bold')
    ctx.pdf.setFontSize(10)
    ctx.pdf.setTextColor(15, 23, 42)
    const labelLines = ctx.pdf.splitTextToSize(field.label, CONTENT_W - 6) as string[]
    ensureSpace(ctx, labelLines.length * 4.6 + 2)
    for (const line of labelLines) {
        ctx.pdf.text(line, MARGIN + 2, ctx.y)
        ctx.y += 4.6
    }

    if (value?.audioUrl) {
        const seconds = value.audioDurationMs ? Math.round(value.audioDurationMs / 1000) : 0
        const meta =
            seconds > 0
                ? `Audio adjunto · ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
                : 'Audio adjunto'
        ctx.pdf.setFont('helvetica', 'italic')
        ctx.pdf.setFontSize(8)
        ctx.pdf.setTextColor(100, 116, 139)
        ctx.pdf.text(meta, MARGIN + 2, ctx.y)
        ctx.y += 4
    }

    ctx.pdf.setFont('helvetica', 'normal')
    ctx.pdf.setFontSize(10)
    ctx.pdf.setTextColor(30, 41, 59)
    const bodyLines = ctx.pdf.splitTextToSize(text, CONTENT_W - 6) as string[]
    for (const line of bodyLines) {
        ensureSpace(ctx, 4.6)
        ctx.pdf.text(line, MARGIN + 2, ctx.y)
        ctx.y += 4.6
    }

    ctx.y += 3
    ctx.pdf.setDrawColor(220, 226, 234)
    ctx.pdf.setLineWidth(0.2)
    ctx.pdf.line(MARGIN + 2, ctx.y, MARGIN + CONTENT_W - 2, ctx.y)
    ctx.y += 3
}

function writeGroup(ctx: WriterCtx, group: WB1Group, values: Record<string, WB1ValueShape>) {
    const hasAny = group.fields.some((field) => values[field.id]?.text?.trim())
    if (!hasAny) return

    if (group.title) {
        ensureSpace(ctx, 8)
        writeParagraph(ctx, group.title, { size: 12, bold: true, color: [15, 23, 42], gap: 1 })
    }
    if (group.description) {
        writeParagraph(ctx, group.description, { size: 9, color: [100, 116, 139], gap: 2 })
    }

    for (const field of group.fields) {
        writeFieldCard(ctx, field, values[field.id])
    }
    ctx.y += 2
}

function writeSection(ctx: WriterCtx, section: WB1Section, values: Record<string, WB1ValueShape>) {
    newPage(ctx)

    writeParagraph(ctx, section.label, { size: 18, bold: true, color: [13, 27, 42], gap: 3 })
    if (section.purpose) {
        writeParagraph(ctx, section.purpose, { size: 10, color: [71, 85, 105], gap: 4 })
    }

    if (section.concepts && section.concepts.length > 0) {
        writeParagraph(ctx, 'Conceptos eje', { size: 9, bold: true, color: [148, 113, 0], gap: 1 })
        for (const concept of section.concepts) {
            writeParagraph(ctx, `• ${concept}`, { size: 9, color: [71, 85, 105], gap: 0 })
        }
        ctx.y += 2
    }

    if (section.prompts && section.prompts.length > 0) {
        writeParagraph(ctx, 'Claves de trabajo', { size: 9, bold: true, color: [148, 113, 0], gap: 1 })
        for (const prompt of section.prompts) {
            writeParagraph(ctx, `• ${prompt}`, { size: 9, color: [71, 85, 105], gap: 0 })
        }
        ctx.y += 2
    }

    for (const group of section.groups) {
        writeGroup(ctx, group, values)
    }
}

async function loadLogoDataUrl(url: string | undefined | null): Promise<{
    dataUrl: string
    format: 'PNG' | 'JPEG'
    naturalWidth: number
    naturalHeight: number
} | null> {
    if (!url || typeof window === 'undefined') return null
    try {
        const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
        if (!response.ok) return null
        const blob = await response.blob()
        const mime = blob.type.toLowerCase()
        if (mime.includes('svg')) return null
        const format: 'PNG' | 'JPEG' = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG'
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error('FileReader failed'))
            reader.readAsDataURL(blob)
        })
        const dimensions = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
            img.onerror = () => reject(new Error('Image decode failed'))
            img.src = dataUrl
        })
        return { dataUrl, format, naturalWidth: dimensions.w, naturalHeight: dimensions.h }
    } catch {
        return null
    }
}

export async function downloadWorkbookV3Pdf(
    config: WB1Config,
    values: Record<string, WB1ValueShape>,
    leaderName: string,
    logoDarkUrl?: string | null,
) {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const ctx: WriterCtx = { pdf, y: MARGIN }

    const logo = await loadLogoDataUrl(logoDarkUrl ?? null)

    // Portada — banda navy
    ctx.pdf.setFillColor(13, 27, 42)
    ctx.pdf.rect(0, 0, PAGE_W, 80, 'F')

    if (logo) {
        const targetWidth = 32
        const aspect = logo.naturalHeight / Math.max(logo.naturalWidth, 1)
        const targetHeight = Math.min(16, Math.max(8, targetWidth * aspect))
        try {
            ctx.pdf.addImage(
                logo.dataUrl,
                logo.format,
                MARGIN,
                12,
                targetWidth,
                targetHeight,
                undefined,
                'FAST',
            )
        } catch {
            // logo opcional, no detener export si falla
        }
    }

    ctx.pdf.setFont('helvetica', 'bold')
    ctx.pdf.setFontSize(11)
    ctx.pdf.setTextColor(212, 175, 55)
    ctx.pdf.text(`${config.code} ${config.version} · ${config.pillar}`, MARGIN, 36)

    ctx.pdf.setFont('helvetica', 'bold')
    ctx.pdf.setFontSize(20)
    ctx.pdf.setTextColor(255, 255, 255)
    const titleLines = ctx.pdf.splitTextToSize(config.title, CONTENT_W) as string[]
    let cursorY = 48
    for (const line of titleLines) {
        ctx.pdf.text(line, MARGIN, cursorY)
        cursorY += 8.5
    }

    ctx.pdf.setFont('helvetica', 'normal')
    ctx.pdf.setFontSize(10)
    ctx.pdf.setTextColor(226, 232, 240)
    const subtitleLines = ctx.pdf.splitTextToSize(config.summary, CONTENT_W) as string[]
    for (const line of subtitleLines) {
        if (cursorY > 76) break
        ctx.pdf.text(line, MARGIN, cursorY)
        cursorY += 5
    }

    ctx.y = 100
    writeParagraph(ctx, `Líder: ${leaderName}`, { size: 11, bold: true, color: [15, 23, 42], gap: 1 })
    writeParagraph(ctx, `Fecha de exportación: ${formatDate(new Date())}`, { size: 9, color: [100, 116, 139], gap: 6 })

    writeParagraph(ctx, 'Objetivo', { size: 12, bold: true, color: [13, 27, 42], gap: 1 })
    writeParagraph(ctx, config.objective, { size: 10, color: [30, 41, 59], gap: 4 })

    writeParagraph(ctx, 'Entregables del workbook', { size: 12, bold: true, color: [13, 27, 42], gap: 1 })
    for (const deliverable of config.deliverables) {
        writeParagraph(ctx, `• ${deliverable}`, { size: 10, color: [30, 41, 59], gap: 0 })
    }
    ctx.y += 4

    writeParagraph(ctx, 'Competencias 4Shine', { size: 12, bold: true, color: [13, 27, 42], gap: 1 })
    writeParagraph(ctx, config.competencies.join(' · '), { size: 10, color: [30, 41, 59], gap: 4 })

    for (const section of config.sections) {
        writeSection(ctx, section, values)
    }

    // Cierre
    newPage(ctx)
    writeParagraph(ctx, 'Cierre reflexivo', { size: 16, bold: true, color: [13, 27, 42], gap: 3 })
    writeParagraph(ctx, config.closing, { size: 10, color: [30, 41, 59], gap: 4 })

    // Pie en cada página
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text(
            `${config.code} · ${sanitizeName(leaderName).replaceAll('_', ' ')} · página ${i}/${totalPages}`,
            MARGIN,
            PAGE_H - 8,
        )
    }

    pdf.save(`WB1_${sanitizeName(leaderName) || 'lider'}.pdf`)
}
