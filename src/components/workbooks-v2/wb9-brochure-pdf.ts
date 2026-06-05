'use client'

// Brochure ejecutivo PDF para el WB9 - Latido de Marca Ejecutiva.
// Genera un libro de marca con foto + paleta personalizable del líder.
// Defaults 4Shine si el líder no edita los campos de identidad visual.

import type { jsPDF } from 'jspdf'
import type { WB1Config } from '@/lib/workbooks-v2-wb1'

type ValueShape = {
    text: string
    audioUrl?: string
    audioDurationMs?: number
    aiGenerated?: boolean
}

type Values = Record<string, ValueShape>

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 16

type Rgb = [number, number, number]

type Palette = {
    primary: Rgb
    secondary: Rgb
    accent: Rgb
    surface: Rgb
    onPrimary: Rgb
    body: Rgb
    muted: Rgb
}

const FOURSHINE_PALETTE: Palette = {
    primary: [13, 27, 42],
    secondary: [27, 38, 59],
    accent: [201, 162, 39],
    surface: [244, 241, 234],
    onPrimary: [255, 255, 255],
    body: [30, 41, 59],
    muted: [100, 116, 139],
}

function hexToRgb(hex: string | undefined, fallback: Rgb): Rgb {
    if (!hex) return fallback
    const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
    if (!m) return fallback
    const n = parseInt(m[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function readText(values: Values, id: string): string {
    return (values[id]?.text ?? '').trim()
}

function buildPalette(values: Values): Palette {
    return {
        primary: hexToRgb(readText(values, 'wb9v3-0-color-primario'), FOURSHINE_PALETTE.primary),
        secondary: hexToRgb(readText(values, 'wb9v3-0-color-secundario'), FOURSHINE_PALETTE.secondary),
        accent: hexToRgb(readText(values, 'wb9v3-0-color-acento'), FOURSHINE_PALETTE.accent),
        surface: hexToRgb(readText(values, 'wb9v3-0-color-fondo'), FOURSHINE_PALETTE.surface),
        onPrimary: FOURSHINE_PALETTE.onPrimary,
        body: FOURSHINE_PALETTE.body,
        muted: FOURSHINE_PALETTE.muted,
    }
}

function sanitizeName(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
}

type LoadedImage = {
    dataUrl: string
    format: 'PNG' | 'JPEG'
    width: number
    height: number
}

async function loadImageDataUrl(url: string | undefined | null): Promise<LoadedImage | null> {
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
        return { dataUrl, format, width: dimensions.w, height: dimensions.h }
    } catch {
        return null
    }
}

function setFill(pdf: jsPDF, rgb: Rgb) {
    pdf.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setText(pdf: jsPDF, rgb: Rgb) {
    pdf.setTextColor(rgb[0], rgb[1], rgb[2])
}

function setDraw(pdf: jsPDF, rgb: Rgb) {
    pdf.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function drawSectionFrame(pdf: jsPDF, palette: Palette, sectionNumber: string, sectionLabel: string, leaderName: string) {
    setFill(pdf, palette.surface)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

    setFill(pdf, palette.primary)
    pdf.rect(0, 0, PAGE_W, 28, 'F')

    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(sectionNumber, MARGIN, 12)

    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text(sectionLabel, MARGIN, 20)

    setFill(pdf, palette.primary)
    pdf.rect(0, PAGE_H - 14, PAGE_W, 14, 'F')
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(`${leaderName.toUpperCase()} · LATIDO DE MARCA EJECUTIVA`, MARGIN, PAGE_H - 5)
    pdf.text(pdf.getCurrentPageInfo().pageNumber.toString().padStart(2, '0'), PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' })
}

function wrappedText(
    pdf: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
): number {
    if (!text) return y
    const lines = pdf.splitTextToSize(text, maxWidth) as string[]
    let cursor = y
    for (const line of lines) {
        pdf.text(line, x, cursor)
        cursor += lineHeight
    }
    return cursor
}

function drawAccentBar(pdf: jsPDF, palette: Palette, x: number, y: number, w = 18, h = 1.6) {
    setFill(pdf, palette.accent)
    pdf.rect(x, y, w, h, 'F')
}

function drawCover(
    pdf: jsPDF,
    palette: Palette,
    config: WB1Config,
    values: Values,
    leaderName: string,
    photo: LoadedImage | null,
    logo: LoadedImage | null,
) {
    setFill(pdf, palette.primary)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

    setFill(pdf, palette.secondary)
    pdf.rect(0, PAGE_H * 0.62, PAGE_W, PAGE_H * 0.38, 'F')

    if (logo) {
        const targetW = 30
        const aspect = logo.height / Math.max(logo.width, 1)
        const targetH = Math.min(14, Math.max(8, targetW * aspect))
        try {
            pdf.addImage(logo.dataUrl, logo.format, MARGIN, 14, targetW, targetH, undefined, 'FAST')
        } catch {
            // logo opcional
        }
    }

    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('4SHINE · LATIDO DE MARCA EJECUTIVA', PAGE_W - MARGIN, 20, { align: 'right' })

    if (photo) {
        const photoW = 70
        const photoH = 90
        const photoX = (PAGE_W - photoW) / 2
        const photoY = 40
        try {
            pdf.addImage(photo.dataUrl, photo.format, photoX, photoY, photoW, photoH, undefined, 'FAST')
            setDraw(pdf, palette.accent)
            pdf.setLineWidth(1)
            pdf.rect(photoX, photoY, photoW, photoH, 'S')
        } catch {
            // foto opcional
        }
    }

    const titleY = photo ? 148 : 110
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(28)
    pdf.text('Latido de Marca', PAGE_W / 2, titleY, { align: 'center' })

    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text('— Brochure ejecutivo —', PAGE_W / 2, titleY + 8, { align: 'center' })

    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(leaderName, PAGE_W / 2, PAGE_H * 0.66, { align: 'center' })

    const fraseCentral =
        readText(values, 'wb9v3-13-frase') ||
        readText(values, 'wb9v3-0-frase-portada') ||
        config.summary
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    wrappedText(pdf, `"${fraseCentral}"`, MARGIN + 8, PAGE_H * 0.72, PAGE_W - (MARGIN + 8) * 2, 5.5)

    const edicion = readText(values, 'wb9v3-0-edicion') || '2026 · Edición ejecutiva'
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(edicion.toUpperCase(), PAGE_W / 2, PAGE_H - 18, { align: 'center' })
}

function drawNarrativa(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '01 · NARRATIVA', 'Narrativa de marca ejecutiva', leaderName)

    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(leaderName, MARGIN, 42)
    drawAccentBar(pdf, palette, MARGIN, 45)

    const narrativa = readText(values, 'wb9v3-13-narrativa') || readText(values, 'wb9v3-1-narr')
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)
    let y = wrappedText(pdf, narrativa || 'Pendiente.', MARGIN, 56, PAGE_W - MARGIN * 2, 5.4)

    y += 4
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('HOY LIDERO DESDE', MARGIN, y)
    y += 6

    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    y = wrappedText(pdf, readText(values, 'wb9v3-1-f4') || readText(values, 'wb9v3-13-proposito') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5)

    const frase =
        readText(values, 'wb9v3-13-frase') ||
        readText(values, 'wb9v3-0-frase-portada')
    if (frase) {
        y += 6
        setFill(pdf, palette.accent)
        pdf.rect(MARGIN, y, 3, 14, 'F')
        setText(pdf, palette.secondary)
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(11)
        wrappedText(pdf, `"${frase}"`, MARGIN + 6, y + 6, PAGE_W - MARGIN * 2 - 6, 5.5)
    }
}

function drawPilarBlock(
    pdf: jsPDF,
    palette: Palette,
    x: number,
    y: number,
    w: number,
    h: number,
    number: string,
    name: string,
    description: string,
    evidence: string,
) {
    setFill(pdf, palette.onPrimary)
    pdf.rect(x, y, w, h, 'F')
    setDraw(pdf, palette.secondary)
    pdf.setLineWidth(0.3)
    pdf.rect(x, y, w, h, 'S')

    setFill(pdf, palette.accent)
    pdf.rect(x, y, w, 5, 'F')

    setText(pdf, palette.primary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(22)
    pdf.text(number, x + 4, y + 18)

    setText(pdf, palette.primary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    let cursor = wrappedText(pdf, name || 'Pilar', x + 4, y + 26, w - 8, 5)

    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    cursor = wrappedText(pdf, description, x + 4, cursor + 3, w - 8, 4.4)

    if (evidence) {
        cursor += 3
        setText(pdf, palette.secondary)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text('EVIDENCIA', x + 4, cursor)
        cursor += 4
        setText(pdf, palette.muted)
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(8.5)
        wrappedText(pdf, evidence, x + 4, cursor, w - 8, 4)
    }
}

function drawPilares(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '02 · LIDERAZGO DE IMPACTO', 'Tres pilares que sostienen mi marca', leaderName)

    const cardY = 42
    const cardH = (PAGE_H - cardY - 24) / 3
    const cardW = PAGE_W - MARGIN * 2

    const pilares = [
        {
            number: '01',
            name: readText(values, 'wb9v3-3-p1-nombre'),
            description: readText(values, 'wb9v3-3-p1-significa') || readText(values, 'wb9v3-3-p1-conducta'),
            evidence: readText(values, 'wb9v3-3-p1-evidencia'),
        },
        {
            number: '02',
            name: readText(values, 'wb9v3-3-p2-nombre'),
            description: readText(values, 'wb9v3-3-p2-significa') || readText(values, 'wb9v3-3-p2-conducta'),
            evidence: readText(values, 'wb9v3-3-p2-evidencia'),
        },
        {
            number: '03',
            name: readText(values, 'wb9v3-3-p3-nombre'),
            description: readText(values, 'wb9v3-3-p3-significa') || readText(values, 'wb9v3-3-p3-conducta'),
            evidence: readText(values, 'wb9v3-3-p3-evidencia'),
        },
    ]

    pilares.forEach((p, i) => {
        drawPilarBlock(
            pdf,
            palette,
            MARGIN,
            cardY + i * (cardH + 2),
            cardW,
            cardH - 2,
            p.number,
            p.name,
            p.description,
            p.evidence,
        )
    })
}

function drawProposito(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '03 · PROPÓSITO', 'Mi propósito siempre es mi guía', leaderName)

    const proposito = readText(values, 'wb9v3-13-proposito') || readText(values, 'wb9v3-5-p1')

    const colW = (PAGE_W - MARGIN * 2 - 4) / 2
    const startY = 42
    const blockH = 40

    const blocks = [
        {
            tag: 'NARRATIVA',
            label: 'Hoy lidero desde',
            text: readText(values, 'wb9v3-1-f4') || readText(values, 'wb9v3-1-narr'),
        },
        {
            tag: 'PROMESA',
            label: 'Mi promesa de valor',
            text: readText(values, 'wb9v3-13-promesa') || readText(values, 'wb9v3-5-pv-ia'),
        },
        {
            tag: 'DIFERENCIAL',
            label: 'Lo que me hace diferente',
            text: readText(values, 'wb9v3-13-diferencial') || readText(values, 'wb9v3-6-d-ia'),
        },
        {
            tag: 'CAUSA',
            label: 'Mi causa',
            text: readText(values, 'wb9v3-13-causa') || readText(values, 'wb9v3-6-c1'),
        },
    ]

    blocks.forEach((b, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = MARGIN + col * (colW + 4)
        const y = startY + row * (blockH + 4)
        setFill(pdf, palette.onPrimary)
        pdf.rect(x, y, colW, blockH, 'F')
        setDraw(pdf, palette.secondary)
        pdf.setLineWidth(0.3)
        pdf.rect(x, y, colW, blockH, 'S')

        setText(pdf, palette.accent)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text(b.tag, x + 4, y + 6)

        setText(pdf, palette.primary)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text(b.label, x + 4, y + 12)

        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        wrappedText(pdf, b.text || 'Pendiente.', x + 4, y + 18, colW - 8, 4.3)
    })

    const propY = startY + blockH * 2 + 8 + 4
    setFill(pdf, palette.primary)
    pdf.rect(MARGIN, propY, PAGE_W - MARGIN * 2, PAGE_H - propY - 22, 'F')
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('PROPÓSITO', MARGIN + 6, propY + 8)
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    wrappedText(pdf, `"${proposito || 'Pendiente.'}"`, MARGIN + 6, propY + 16, PAGE_W - MARGIN * 2 - 12, 5.4)
}

function drawAudienciaProblemas(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '04 · PROMESA DE VALOR', 'Audiencia y problemas que resuelvo', leaderName)

    const audY = 42
    setFill(pdf, palette.primary)
    pdf.rect(MARGIN, audY, PAGE_W - MARGIN * 2, 30, 'F')
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('AUDIENCIA PRIORITARIA', MARGIN + 6, audY + 8)
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    wrappedText(
        pdf,
        readText(values, 'wb9v3-13-audiencia') || readText(values, 'wb9v3-6-a1') || 'Pendiente.',
        MARGIN + 6,
        audY + 16,
        PAGE_W - MARGIN * 2 - 12,
        4.8,
    )

    let y = audY + 36
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('PROBLEMAS QUE RESUELVO', MARGIN, y)
    y += 6

    const cardW = (PAGE_W - MARGIN * 2 - 8) / 3
    const cardH = 60
    const problemas = [
        { n: '01', label: readText(values, 'wb9v3-5-pr1') },
        { n: '02', label: readText(values, 'wb9v3-5-pr2') },
        { n: '03', label: readText(values, 'wb9v3-5-pr3') },
    ]

    problemas.forEach((p, i) => {
        const x = MARGIN + i * (cardW + 4)
        setFill(pdf, palette.onPrimary)
        pdf.rect(x, y, cardW, cardH, 'F')
        setDraw(pdf, palette.secondary)
        pdf.setLineWidth(0.3)
        pdf.rect(x, y, cardW, cardH, 'S')

        setText(pdf, palette.accent)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(16)
        pdf.text(p.n, x + 4, y + 12)

        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        wrappedText(pdf, p.label || 'Pendiente.', x + 4, y + 20, cardW - 8, 4.3)
    })
}

function drawArquetipo(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '05 · ARQUETIPO, ESTILO Y VALORES', readText(values, 'wb9v3-13-arquetipo') || readText(values, 'wb9v3-7-a1') || 'Mi arquetipo de marca', leaderName)

    let y = 44
    setFill(pdf, palette.primary)
    pdf.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30, 'F')
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('ARQUETIPO PRINCIPAL', MARGIN + 6, y + 8)
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text(readText(values, 'wb9v3-7-a1') || 'Mi arquetipo', MARGIN + 6, y + 16)
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    wrappedText(pdf, readText(values, 'wb9v3-7-a2'), MARGIN + 6, y + 22, PAGE_W - MARGIN * 2 - 12, 4.4)

    y += 38
    const colW = (PAGE_W - MARGIN * 2 - 8) / 3
    const colH = 60
    const cols = [
        { tag: 'ESTILO', body: readText(values, 'wb9v3-7-e1') },
        { tag: 'TONO', body: `${readText(values, 'wb9v3-13-tono') || readText(values, 'wb9v3-7-e2')}` },
        { tag: 'VOZ', body: `${readText(values, 'wb9v3-7-e3')}${readText(values, 'wb9v3-7-e4') ? '\nEvita: ' + readText(values, 'wb9v3-7-e4') : ''}` },
    ]
    cols.forEach((c, i) => {
        const x = MARGIN + i * (colW + 4)
        setFill(pdf, palette.onPrimary)
        pdf.rect(x, y, colW, colH, 'F')
        setDraw(pdf, palette.secondary)
        pdf.setLineWidth(0.3)
        pdf.rect(x, y, colW, colH, 'S')
        setText(pdf, palette.accent)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(c.tag, x + 4, y + 8)
        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9.5)
        wrappedText(pdf, c.body || 'Pendiente.', x + 4, y + 16, colW - 8, 4.4)
    })

    y += colH + 8
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('VALORES', MARGIN, y)
    y += 6
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const valores = [
        readText(values, 'wb9v3-7-v1'),
        readText(values, 'wb9v3-7-v2'),
        readText(values, 'wb9v3-7-v3'),
        readText(values, 'wb9v3-7-v4'),
        readText(values, 'wb9v3-7-v5'),
    ].filter(Boolean)
    for (const v of valores) {
        y = wrappedText(pdf, `• ${v}`, MARGIN, y, PAGE_W - MARGIN * 2, 5)
    }
}

function drawSimbolo(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '06 · CÓDIGO SIMBÓLICO DE MARCA', readText(values, 'wb9v3-13-simbolo') || readText(values, 'wb9v3-7-s1') || 'Mi símbolo de marca', leaderName)

    const y0 = 50
    setFill(pdf, palette.primary)
    pdf.circle(PAGE_W / 2, y0 + 35, 30, 'F')
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.text(readText(values, 'wb9v3-7-s1') || 'Símbolo', PAGE_W / 2, y0 + 38, { align: 'center' })

    let y = y0 + 80
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    y = wrappedText(pdf, readText(values, 'wb9v3-7-s2') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5.4)

    y += 6
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('PALABRAS ASOCIADAS', MARGIN, y)
    y += 6
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    wrappedText(pdf, readText(values, 'wb9v3-7-s3') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5.4)
}

function drawStorytelling(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '07 · STORYTELLING DE CONEXIÓN', 'Historia para conectar con mi audiencia', leaderName)

    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)
    let y = wrappedText(
        pdf,
        readText(values, 'wb9v3-8-story') || 'Pendiente.',
        MARGIN,
        46,
        PAGE_W - MARGIN * 2,
        5.4,
    )

    y += 6
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('MANTRAS DE LIDERAZGO', MARGIN, y)
    y += 6

    const mantras = [
        readText(values, 'wb9v3-4-m1'),
        readText(values, 'wb9v3-4-m2'),
        readText(values, 'wb9v3-4-m3'),
        readText(values, 'wb9v3-4-m4'),
    ].filter(Boolean)

    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(10.5)
    for (const m of mantras) {
        y = wrappedText(pdf, `"${m}"`, MARGIN + 6, y, PAGE_W - MARGIN * 2 - 6, 5)
        y += 2
    }
}

function drawContenido(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '08 · PILARES DE CONTENIDO', 'Tres pilares de contenido principales', leaderName)

    const cardY = 42
    const cardW = (PAGE_W - MARGIN * 2 - 8) / 3
    const cardH = PAGE_H - cardY - 24

    const pilares = [
        {
            number: '01',
            name: readText(values, 'wb9v3-9-c1-nombre'),
            idea: readText(values, 'wb9v3-9-c1-idea'),
            percepcion: readText(values, 'wb9v3-9-c1-percepcion'),
            tema: readText(values, 'wb9v3-9-c1-tema'),
        },
        {
            number: '02',
            name: readText(values, 'wb9v3-9-c2-nombre'),
            idea: readText(values, 'wb9v3-9-c2-idea'),
            percepcion: readText(values, 'wb9v3-9-c2-percepcion'),
            tema: readText(values, 'wb9v3-9-c2-tema'),
        },
        {
            number: '03',
            name: readText(values, 'wb9v3-9-c3-nombre'),
            idea: readText(values, 'wb9v3-9-c3-idea'),
            percepcion: readText(values, 'wb9v3-9-c3-percepcion'),
            tema: readText(values, 'wb9v3-9-c3-tema'),
        },
    ]

    pilares.forEach((p, i) => {
        const x = MARGIN + i * (cardW + 4)
        setFill(pdf, palette.onPrimary)
        pdf.rect(x, cardY, cardW, cardH, 'F')
        setDraw(pdf, palette.secondary)
        pdf.setLineWidth(0.3)
        pdf.rect(x, cardY, cardW, cardH, 'S')

        setFill(pdf, palette.accent)
        pdf.rect(x, cardY, cardW, 5, 'F')

        setText(pdf, palette.primary)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(20)
        pdf.text(p.number, x + 4, cardY + 18)

        setText(pdf, palette.primary)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        let cursor = wrappedText(pdf, p.name || 'Pilar', x + 4, cardY + 26, cardW - 8, 5)

        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        cursor = wrappedText(pdf, p.idea, x + 4, cursor + 3, cardW - 8, 4.4)

        if (p.tema) {
            cursor += 3
            setText(pdf, palette.secondary)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(8)
            pdf.text('TEMA', x + 4, cursor)
            cursor += 4
            setText(pdf, palette.muted)
            pdf.setFont('helvetica', 'italic')
            pdf.setFontSize(8.5)
            wrappedText(pdf, p.tema, x + 4, cursor, cardW - 8, 4)
        }
    })
}

function drawLinkedIn(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '09 · LINKEDIN', 'Titular, banner y "Acerca de"', leaderName)

    let y = 44
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('TITULAR (HEADLINE)', MARGIN, y)
    y += 6
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)
    y = wrappedText(pdf, readText(values, 'wb9v3-13-titular') || readText(values, 'wb9v3-10-titular') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5.2)

    y += 6
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('BANNER', MARGIN, y)
    y += 6
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(10.5)
    y = wrappedText(pdf, readText(values, 'wb9v3-13-banner') || readText(values, 'wb9v3-10-banner') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5.2)

    y += 6
    setText(pdf, palette.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('ACERCA DE (EXTRACTO)', MARGIN, y)
    y += 6
    setText(pdf, palette.body)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    wrappedText(pdf, readText(values, 'wb9v3-10-acerca') || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 5)
}

function drawPlan(pdf: jsPDF, palette: Palette, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '10 · PLAN 30/60/90 DÍAS', 'Activación de la marca ejecutiva', leaderName)

    const cardY = 42
    const cardW = (PAGE_W - MARGIN * 2 - 8) / 3
    const cardH = PAGE_H - cardY - 24

    const fases = [
        { dias: '30', foco: 'Claridad y ajuste', acciones: readText(values, 'wb9v3-12-d30') },
        { dias: '60', foco: 'Visibilidad dirigida', acciones: readText(values, 'wb9v3-12-d60') },
        { dias: '90', foco: 'Posicionamiento', acciones: readText(values, 'wb9v3-12-d90') },
    ]

    fases.forEach((f, i) => {
        const x = MARGIN + i * (cardW + 4)
        setFill(pdf, palette.primary)
        pdf.rect(x, cardY, cardW, 32, 'F')
        setText(pdf, palette.accent)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(28)
        pdf.text(f.dias, x + 4, cardY + 18)
        setText(pdf, palette.onPrimary)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text('días', x + 4, cardY + 26)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text(f.foco, x + 4, cardY + 32 - 2)

        setFill(pdf, palette.onPrimary)
        pdf.rect(x, cardY + 32, cardW, cardH - 32, 'F')
        setDraw(pdf, palette.secondary)
        pdf.setLineWidth(0.3)
        pdf.rect(x, cardY, cardW, cardH, 'S')

        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        wrappedText(pdf, f.acciones || 'Pendiente.', x + 4, cardY + 40, cardW - 8, 4.3)
    })
}

function drawSintesis(pdf: jsPDF, palette: Palette, config: WB1Config, values: Values, leaderName: string) {
    pdf.addPage()
    drawSectionFrame(pdf, palette, '11 · SÍNTESIS', 'Síntesis del Latido de Marca', leaderName)

    let y = 44
    const blocks = [
        { tag: 'FRASE CENTRAL', body: readText(values, 'wb9v3-13-frase') || readText(values, 'wb9v3-0-frase-portada') || config.summary },
        { tag: 'ARQUETIPO', body: readText(values, 'wb9v3-13-arquetipo') || readText(values, 'wb9v3-7-a1') },
        { tag: 'SÍMBOLO', body: readText(values, 'wb9v3-13-simbolo') || readText(values, 'wb9v3-7-s1') },
        { tag: 'TONO', body: readText(values, 'wb9v3-13-tono') || readText(values, 'wb9v3-7-e2') },
        { tag: 'AUDIENCIA', body: readText(values, 'wb9v3-13-audiencia') || readText(values, 'wb9v3-6-a1') },
        { tag: 'PROMESA DE VALOR', body: readText(values, 'wb9v3-13-promesa') || readText(values, 'wb9v3-5-pv-ia') },
        { tag: 'CAUSA', body: readText(values, 'wb9v3-13-causa') || readText(values, 'wb9v3-6-c1') },
    ]

    for (const b of blocks) {
        setText(pdf, palette.accent)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(b.tag, MARGIN, y)
        y += 5
        setText(pdf, palette.body)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        y = wrappedText(pdf, b.body || 'Pendiente.', MARGIN, y, PAGE_W - MARGIN * 2, 4.8)
        y += 4
        if (y > PAGE_H - 30) {
            pdf.addPage()
            drawSectionFrame(pdf, palette, '11 · SÍNTESIS', 'Síntesis del Latido de Marca (cont.)', leaderName)
            y = 44
        }
    }
}

function drawCierre(pdf: jsPDF, palette: Palette, config: WB1Config, values: Values, leaderName: string) {
    pdf.addPage()
    setFill(pdf, palette.primary)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('CIERRE', PAGE_W / 2, PAGE_H * 0.18, { align: 'center' })

    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(26)
    pdf.text(leaderName, PAGE_W / 2, PAGE_H * 0.28, { align: 'center' })

    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    wrappedText(pdf, config.closing, MARGIN + 6, PAGE_H * 0.36, PAGE_W - (MARGIN + 6) * 2, 5.6)

    const frase = readText(values, 'wb9v3-13-frase') || readText(values, 'wb9v3-0-frase-portada') || config.summary
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(13)
    wrappedText(pdf, `"${frase}"`, MARGIN + 6, PAGE_H * 0.75, PAGE_W - (MARGIN + 6) * 2, 6)

    const edicion = readText(values, 'wb9v3-0-edicion') || '2026 · Edición ejecutiva'
    setText(pdf, palette.accent)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(edicion.toUpperCase(), PAGE_W / 2, PAGE_H - 16, { align: 'center' })
    setText(pdf, palette.onPrimary)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('4SHINE · LATIDO DE MARCA EJECUTIVA', PAGE_W / 2, PAGE_H - 10, { align: 'center' })
}

export async function downloadWb9BrochurePdf(
    config: WB1Config,
    values: Values,
    leaderName: string,
    logoDarkUrl?: string | null,
) {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const palette = buildPalette(values)

    const photoUrl = readText(values, 'wb9v3-0-foto-url')
    const [photo, logo] = await Promise.all([loadImageDataUrl(photoUrl || null), loadImageDataUrl(logoDarkUrl ?? null)])

    drawCover(pdf, palette, config, values, leaderName, photo, logo)
    drawNarrativa(pdf, palette, values, leaderName)
    drawPilares(pdf, palette, values, leaderName)
    drawProposito(pdf, palette, values, leaderName)
    drawAudienciaProblemas(pdf, palette, values, leaderName)
    drawArquetipo(pdf, palette, values, leaderName)
    drawSimbolo(pdf, palette, values, leaderName)
    drawStorytelling(pdf, palette, values, leaderName)
    drawContenido(pdf, palette, values, leaderName)
    drawLinkedIn(pdf, palette, values, leaderName)
    drawPlan(pdf, palette, values, leaderName)
    drawSintesis(pdf, palette, config, values, leaderName)
    drawCierre(pdf, palette, config, values, leaderName)

    pdf.save(`Latido_de_Marca_${sanitizeName(leaderName) || 'lider'}.pdf`)
}
