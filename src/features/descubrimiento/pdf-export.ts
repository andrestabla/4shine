"use client";

import { jsPDF } from "jspdf";
import { PILLAR_INFO } from "./DiagnosticsData";
import { buildDiscoveryReports, getDiscoveryStatus } from "./reporting";
import { registerBrandFontInPdf, resolvePdfBranding, type PdfBrandingInput, type PdfBrandingResolved } from "@/lib/pdf-branding";
import { formatDateTime } from "@/lib/format-date";

function shade(rgb: [number, number, number], whiteRatio: number): [number, number, number] {
  const w = Math.max(0, Math.min(1, whiteRatio));
  return [
    Math.round(rgb[0] * (1 - w) + 255 * w),
    Math.round(rgb[1] * (1 - w) + 255 * w),
    Math.round(rgb[2] * (1 - w) + 255 * w),
  ];
}

function pillarPalette(b: PdfBrandingResolved): {
  within: [number, number, number];
  out: [number, number, number];
  up: [number, number, number];
  beyond: [number, number, number];
} {
  return {
    within: b.primary,
    out: shade(b.primary, 0.35),
    up: b.accent,
    beyond: shade(b.accent, 0.35),
  };
}
import type {
  DiscoveryAiReports,
  DiscoveryPillarKey,
  DiscoveryScoreResult,
  DiscoveryUserState,
} from "./types";

interface DownloadDiscoveryPdfInput {
  participantName: string;
  state: DiscoveryUserState;
  scoring: DiscoveryScoreResult;
  reports?: DiscoveryAiReports | null;
  branding?: PdfBrandingInput | null;
  /** Correo del participante (no vive en `state`; se pasa aparte). */
  email?: string | null;
}

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH_MM - PAGE_MARGIN * 2;
const BODY_LINE_HEIGHT = 5.8;
const BODY_GAP = 3.2;
const BRANDED_HEADER_HEIGHT = 36;

function drawBrandedHeader(pdf: jsPDF, branding: PdfBrandingResolved) {
  pdf.setFillColor(branding.primary[0], branding.primary[1], branding.primary[2]);
  pdf.rect(0, 0, PAGE_WIDTH_MM, BRANDED_HEADER_HEIGHT, "F");

  if (branding.logo) {
    const targetWidth = 30;
    const aspect = branding.logo.naturalHeight / Math.max(branding.logo.naturalWidth, 1);
    const targetHeight = Math.min(18, Math.max(8, targetWidth * aspect));
    const verticalCenter = (BRANDED_HEADER_HEIGHT - targetHeight) / 2;
    try {
      pdf.addImage(
        branding.logo.dataUrl,
        branding.logo.format,
        PAGE_MARGIN,
        verticalCenter,
        targetWidth,
        targetHeight,
        undefined,
        "FAST",
      );
    } catch {
      // ignora logo si jspdf no puede decodificarlo
    }
  }

  pdf.setFont(branding.font.family, "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(branding.accent[0], branding.accent[1], branding.accent[2]);
  pdf.text("DIAGNÓSTICO 4SHINE", PAGE_WIDTH_MM - PAGE_MARGIN, 16, { align: "right" });

  pdf.setFont(branding.font.family, "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(branding.onPrimary[0], branding.onPrimary[1], branding.onPrimary[2]);
  pdf.text(
    "Reporte ejecutivo de liderazgo",
    PAGE_WIDTH_MM - PAGE_MARGIN,
    22,
    { align: "right" },
  );
}

function sanitizeParticipantName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function normalizeMarkdownText(content: string): Array<{ type: "heading" | "paragraph"; text: string }> {
  return content
    .trim()
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // Títulos y subtítulos: cualquier encabezado markdown (#..######) va en
      // negrita; quitamos también marcadores ** sobrantes del texto del título.
      if (/^#{1,6}\s+/.test(block)) {
        return {
          type: "heading" as const,
          text: block.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim(),
        };
      }

      return {
        type: "paragraph" as const,
        text: block
          .split("\n")
          .map((line) => line.replace(/^\s*[-*]\s+/, "• ").trim())
          .filter(Boolean)
          .join(" "),
      };
    });
}

function drawRoundedCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: [number, number, number],
) {
  pdf.setFillColor(...fillColor);
  pdf.setDrawColor(225, 224, 236);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");
}

function buildWriter(pdf: jsPDF, branding: PdfBrandingResolved) {
  let currentY = PAGE_MARGIN;
  const fontFamily = branding.font.family;

  // La fuente de marca suele ser "variable" (un único TTF con eje de peso):
  // jsPDF no puede seleccionar el peso 700 de ese archivo, así que
  // setFont(...,'bold') se dibuja con el peso por defecto (regular) y la negrita
  // no se ve. Simulamos la negrita trazando el contorno del glifo (faux-bold),
  // proporcional al tamaño de fuente. Mismo tipo de letra, negrita garantizada.
  const fauxBoldStroke = (fontSize: number) => Math.max(0.12, fontSize * 0.013);

  const startNewPage = () => {
    pdf.addPage();
    currentY = PAGE_MARGIN;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight <= PAGE_HEIGHT_MM - PAGE_MARGIN) return;
    startNewPage();
  };

  const setY = (nextY: number) => {
    currentY = nextY;
  };

  const writeWrappedLines = (
    text: string,
    options?: {
      fontSize?: number;
      fontStyle?: "normal" | "bold";
      color?: [number, number, number];
      lineHeight?: number;
      gapAfter?: number;
      x?: number;
      width?: number;
    },
  ) => {
    const {
      fontSize = 11,
      fontStyle = "normal",
      color = branding.body,
      lineHeight = BODY_LINE_HEIGHT,
      gapAfter = BODY_GAP,
      x = PAGE_MARGIN,
      width = CONTENT_WIDTH,
    } = options ?? {};

    const isBold = fontStyle === "bold";
    pdf.setFont(fontFamily, "normal");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    const textOpts = isBold ? { renderingMode: "fillThenStroke" as const } : undefined;
    if (isBold) {
      pdf.setDrawColor(...color);
      pdf.setLineWidth(fauxBoldStroke(fontSize));
    }

    const lines = pdf.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, x, currentY, textOpts);
      currentY += lineHeight;
    }
    currentY += gapAfter;
  };

  // Igual que writeWrappedLines pero interpreta la negrita inline de Markdown
  // (**texto**): reparte las palabras en líneas y dibuja cada palabra con su
  // estilo (normal/negrita), quitando los marcadores **. Así los subtítulos y
  // términos enfatizados del análisis IA salen en negrilla en el PDF.
  const writeRichLines = (
    text: string,
    options?: {
      fontSize?: number;
      color?: [number, number, number];
      lineHeight?: number;
      gapAfter?: number;
      x?: number;
      width?: number;
    },
  ) => {
    const {
      fontSize = 11,
      color = branding.body,
      lineHeight = BODY_LINE_HEIGHT,
      gapAfter = BODY_GAP,
      x = PAGE_MARGIN,
      width = CONTENT_WIDTH,
    } = options ?? {};

    const trimmed = text.trim();
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);

    // Sin marcador de negrita → camino simple (idéntico a writeWrappedLines).
    if (!trimmed.includes("**")) {
      writeWrappedLines(trimmed, { fontSize, color, lineHeight, gapAfter, x, width });
      return;
    }

    // Tokeniza en palabras conservando si cada una lleva espacio antes. Los
    // límites de ** (marcador de negrita) NO introducen espacio, así la
    // puntuación pegada queda bien: "**sólido**." → "sólido." y no "sólido .".
    const words: Array<{ text: string; bold: boolean; spaceBefore: boolean }> = [];
    let pendingSpace = false;
    trimmed.split("**").forEach((segment, index) => {
      const bold = index % 2 === 1;
      if (/^\s/.test(segment)) pendingSpace = true;
      const parts = segment.split(/\s+/).filter(Boolean);
      parts.forEach((word, wordIndex) => {
        const spaceBefore = wordIndex === 0 ? pendingSpace : true;
        words.push({ text: word, bold, spaceBefore: words.length === 0 ? false : spaceBefore });
        pendingSpace = false;
      });
      if (/\s$/.test(segment)) pendingSpace = true;
    });
    if (words.length === 0) {
      currentY += gapAfter;
      return;
    }

    pdf.setFont(fontFamily, "normal");
    const spaceWidth = pdf.getTextWidth(" ");
    const boldStroke = fauxBoldStroke(fontSize);

    let line: Array<{ text: string; bold: boolean; lead: number; w: number }> = [];
    let lineWidth = 0;

    const flushLine = () => {
      if (line.length === 0) return;
      ensureSpace(lineHeight);
      let cursorX = x;
      for (const token of line) {
        cursorX += token.lead;
        pdf.setFont(fontFamily, "normal");
        if (token.bold) {
          // faux-bold: traza el contorno del glifo (ver fauxBoldStroke).
          pdf.setDrawColor(...color);
          pdf.setLineWidth(boldStroke);
          pdf.text(token.text, cursorX, currentY, { renderingMode: "fillThenStroke" });
        } else {
          pdf.text(token.text, cursorX, currentY);
        }
        cursorX += token.w;
      }
      currentY += lineHeight;
      line = [];
      lineWidth = 0;
    };

    for (const word of words) {
      pdf.setFont(fontFamily, "normal");
      const w = pdf.getTextWidth(word.text);
      const lead = line.length > 0 && word.spaceBefore ? spaceWidth : 0;
      const proposed = lineWidth + lead + w;
      if (proposed > width && line.length > 0) {
        flushLine();
        line.push({ text: word.text, bold: word.bold, lead: 0, w });
        lineWidth = w;
      } else {
        line.push({ text: word.text, bold: word.bold, lead, w });
        lineWidth = proposed;
      }
    }
    flushLine();
    currentY += gapAfter;
  };

  const writeHeading = (
    text: string,
    level: "kicker" | "title" | "section" | "subsection" = "section",
  ) => {
    const config =
      level === "kicker"
        ? { size: 10, color: branding.muted, lineHeight: 4.6, gap: 3.5 }
        : level === "title"
          ? { size: 24, color: branding.primary, lineHeight: 8.2, gap: 5.5 }
          : level === "section"
            ? { size: 17, color: branding.primary, lineHeight: 6.5, gap: 4.5 }
            : { size: 12.5, color: shade(branding.primary, 0.25), lineHeight: 5.2, gap: 2.8 };

    writeWrappedLines(text, {
      fontSize: config.size,
      fontStyle: "bold",
      color: config.color,
      lineHeight: config.lineHeight,
      gapAfter: config.gap,
    });
  };

  return {
    getY: () => currentY,
    setY,
    ensureSpace,
    startNewPage,
    writeHeading,
    writeWrappedLines,
    writeRichLines,
  };
}

function drawGlobalRadarChart(
  pdf: jsPDF,
  x: number,
  y: number,
  size: number,
  scoring: DiscoveryScoreResult,
  branding: PdfBrandingResolved,
) {
  const centerX = x + size / 2;
  const centerY = y + size / 2 + 2;
  const radius = size * 0.26;
  const labels = ["Within", "Out", "Up", "Beyond"] as const;
  const values = [
    scoring.pillarMetrics.within.total,
    scoring.pillarMetrics.out.total,
    scoring.pillarMetrics.up.total,
    scoring.pillarMetrics.beyond.total,
  ];

  const pointFor = (index: number, normalizedRadius: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    return {
      x: centerX + Math.cos(angle) * radius * normalizedRadius,
      y: centerY + Math.sin(angle) * radius * normalizedRadius,
    };
  };

  pdf.setLineWidth(0.2);
  pdf.setDrawColor(branding.surfaceMuted[0], branding.surfaceMuted[1], branding.surfaceMuted[2]);
  for (let level = 1; level <= 4; level += 1) {
    const r = level / 4;
    for (let index = 0; index < labels.length; index += 1) {
      const start = pointFor(index, r);
      const end = pointFor((index + 1) % labels.length, r);
      pdf.line(start.x, start.y, end.x, end.y);
    }
  }

  for (let index = 0; index < labels.length; index += 1) {
    const end = pointFor(index, 1);
    pdf.line(centerX, centerY, end.x, end.y);
  }

  const chartPoints = values.map((value, index) => pointFor(index, value / 100));
  const fillTint = shade(branding.primary, 0.7);
  pdf.setFillColor(fillTint[0], fillTint[1], fillTint[2]);
  pdf.setDrawColor(branding.primary[0], branding.primary[1], branding.primary[2]);
  for (let index = 0; index < chartPoints.length; index += 1) {
    const start = chartPoints[index];
    const end = chartPoints[(index + 1) % chartPoints.length];
    pdf.line(start.x, start.y, end.x, end.y);
    pdf.circle(start.x, start.y, 1.2, "F");
  }

  pdf.setFont(branding.font.family, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(branding.primary[0], branding.primary[1], branding.primary[2]);
  pdf.text("SHINE WITHIN", centerX, centerY - radius - 3.5, { align: "center" });
  pdf.text("SHINE OUT", centerX + radius + 2.5, centerY + 1);
  pdf.text("SHINE UP", centerX, centerY + radius + 5.5, { align: "center" });
  pdf.text("SHINE BEYOND", centerX - radius - 2.5, centerY + 1, { align: "right" });
}

function drawMetricBarChart(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  values: Array<{ label: string; value: number; color: [number, number, number] }>,
  branding: PdfBrandingResolved,
) {
  const cardHeight = Math.max(34, 16 + values.length * 10);
  drawRoundedCard(pdf, x, y, width, cardHeight, [255, 255, 255]);
  pdf.setFont(branding.font.family, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(branding.primary[0], branding.primary[1], branding.primary[2]);
  pdf.text(title, x + 4, y + 7);

  values.forEach((entry, index) => {
    const rowY = y + 13 + index * 10;
    const barX = x + 54;
    const barWidth = width - 68;
    const scoreX = x + width - 5;

    pdf.setFont(branding.font.family, "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(branding.muted[0], branding.muted[1], branding.muted[2]);
    pdf.text(entry.label, x + 4, rowY);

    pdf.setFillColor(branding.surfaceMuted[0], branding.surfaceMuted[1], branding.surfaceMuted[2]);
    pdf.roundedRect(barX, rowY - 3.5, barWidth, 4.5, 2, 2, "F");
    pdf.setFillColor(...entry.color);
    pdf.roundedRect(barX, rowY - 3.5, (barWidth * Math.max(0, Math.min(100, entry.value))) / 100, 4.5, 2, 2, "F");

    pdf.setFont(branding.font.family, "bold");
    pdf.setTextColor(branding.primary[0], branding.primary[1], branding.primary[2]);
    pdf.text(`${entry.value}%`, scoreX, rowY, { align: "right" });
  });
}

export async function downloadDiscoveryPdfReport({
  participantName,
  state,
  scoring,
  reports,
  branding,
  email,
}: DownloadDiscoveryPdfInput): Promise<void> {
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const resolvedBranding = await resolvePdfBranding(branding ?? {});
  resolvedBranding.font = await registerBrandFontInPdf(pdf, branding?.fontFamily ?? null);
  drawBrandedHeader(pdf, resolvedBranding);
  const writer = buildWriter(pdf, resolvedBranding);
  writer.setY(BRANDED_HEADER_HEIGHT + 8);
  const resolvedReports = reports ?? {};
  const globalStatus = getDiscoveryStatus(scoring.globalIndex);
  const pillars: DiscoveryPillarKey[] = ["within", "out", "up", "beyond"];
  const generatedAt = formatDateTime(new Date());

  writer.writeHeading("Reporte ejecutivo de liderazgo", "title");
  writer.writeWrappedLines(participantName, {
    fontSize: 12,
    color: resolvedBranding.body,
    lineHeight: 5.2,
    gapAfter: 3.5,
  });

  // Ficha del participante: correo, cargo, país y años de experiencia.
  // El cargo/país/experiencia vienen en `state.profile`; el correo se pasa aparte.
  const metaParts: string[] = [];
  const trimmedEmail = email?.trim();
  if (trimmedEmail) metaParts.push(`Correo: ${trimmedEmail}`);
  if (state.profile.jobRole) metaParts.push(`Cargo: ${state.profile.jobRole}`);
  if (state.profile.country) metaParts.push(`País: ${state.profile.country}`);
  if (state.profile.yearsExperience !== null && state.profile.yearsExperience !== undefined) {
    const yrs = state.profile.yearsExperience;
    metaParts.push(`Experiencia: ${yrs} ${yrs === 1 ? "año" : "años"}`);
  }
  if (metaParts.length > 0) {
    writer.writeWrappedLines(metaParts.join("   ·   "), {
      fontSize: 9.5,
      color: resolvedBranding.body,
      lineHeight: 4.6,
      gapAfter: 3,
    });
  }

  writer.writeWrappedLines(`Generado: ${generatedAt}`, {
    fontSize: 9.5,
    color: resolvedBranding.muted,
    lineHeight: 4.3,
    gapAfter: 6,
  });

  const summaryCardY = writer.getY();
  drawRoundedCard(pdf, PAGE_MARGIN, summaryCardY, CONTENT_WIDTH, 24, resolvedBranding.surface);
  pdf.setFont(resolvedBranding.font.family, "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(resolvedBranding.muted[0], resolvedBranding.muted[1], resolvedBranding.muted[2]);
  pdf.text("ÍNDICE GLOBAL", PAGE_MARGIN + 6, summaryCardY + 7);
  pdf.setFontSize(30);
  pdf.setTextColor(
    resolvedBranding.primary[0],
    resolvedBranding.primary[1],
    resolvedBranding.primary[2],
  );
  pdf.text(`${scoring.globalIndex}%`, PAGE_MARGIN + 6, summaryCardY + 18);
  pdf.setFillColor(
    resolvedBranding.accent[0],
    resolvedBranding.accent[1],
    resolvedBranding.accent[2],
  );
  pdf.roundedRect(PAGE_MARGIN + CONTENT_WIDTH - 42, summaryCardY + 7, 34, 8, 4, 4, "F");
  pdf.setFontSize(9);
  pdf.setTextColor(
    resolvedBranding.primary[0],
    resolvedBranding.primary[1],
    resolvedBranding.primary[2],
  );
  pdf.text(globalStatus.label.toUpperCase(), PAGE_MARGIN + CONTENT_WIDTH - 25, summaryCardY + 12.2, {
    align: "center",
  });
  writer.setY(summaryCardY + 31);

  writer.writeHeading("Mapa global de pilares", "section");
  const chartRowY = writer.getY();
  drawRoundedCard(pdf, PAGE_MARGIN, chartRowY, 84, 68, [255, 255, 255]);
  pdf.setFont(resolvedBranding.font.family, "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(resolvedBranding.muted[0], resolvedBranding.muted[1], resolvedBranding.muted[2]);
  pdf.text("Radar global", PAGE_MARGIN + 4, chartRowY + 7);
  drawGlobalRadarChart(pdf, PAGE_MARGIN + 8, chartRowY + 10, 66, scoring, resolvedBranding);

  const rightX = PAGE_MARGIN + 90;
  const pillarColors = pillarPalette(resolvedBranding);
  drawMetricBarChart(
    pdf,
    rightX,
    chartRowY,
    CONTENT_WIDTH - 90,
    "Resumen por pilar",
    pillars.map((pillar) => ({
      label: PILLAR_INFO[pillar].title,
      value: scoring.pillarMetrics[pillar].total,
      color: pillarColors[pillar],
    })),
    resolvedBranding,
  );
  const descY = chartRowY + 74;
  const descWidth = (CONTENT_WIDTH - 4) / 2;
  const descs = [
    { title: "Shine Within — La esencia", text: "Evalúa el nivel de conexión del líder consigo mismo: sus creencias, emociones, valores, propósito e identidad." },
    { title: "Shine Out — Presencia estratégica", text: "Evalúa la capacidad del líder para comunicar su valor, proyectar confianza y expresar su liderazgo con claridad e impacto." },
    { title: "Shine Up — Ecosistema relacional", text: "Evalúa la capacidad del líder para construir relaciones estratégicas, generar confianza y activar redes de valor." },
    { title: "Shine Beyond — Legado", text: "Evalúa la capacidad del líder para proyectar su liderazgo hacia el futuro y dejar una huella positiva." }
  ];

  descs.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAGE_MARGIN + col * (descWidth + 4);
    const y = descY + row * 22;
    drawRoundedCard(pdf, x, y, descWidth, 18, resolvedBranding.surface);
    pdf.setFont(resolvedBranding.font.family, "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(resolvedBranding.primary[0], resolvedBranding.primary[1], resolvedBranding.primary[2]);
    pdf.text(d.title, x + 3, y + 5);
    pdf.setFont(resolvedBranding.font.family, "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(resolvedBranding.body[0], resolvedBranding.body[1], resolvedBranding.body[2]);
    const lines = pdf.splitTextToSize(d.text, descWidth - 6);
    pdf.text(lines, x + 3, y + 9);
  });

  writer.setY(descY + 46);

  const reportSections: Array<{ key: keyof typeof resolvedReports; title: string; pillar?: DiscoveryPillarKey }> = [
    { key: "all", title: "Visión general" },
    { key: "within", title: PILLAR_INFO.within.title, pillar: "within" },
    { key: "out", title: PILLAR_INFO.out.title, pillar: "out" },
    { key: "up", title: PILLAR_INFO.up.title, pillar: "up" },
    { key: "beyond", title: PILLAR_INFO.beyond.title, pillar: "beyond" },
  ];

  for (const section of reportSections) {
    writer.startNewPage();
    writer.writeHeading(section.title, "section");

    const sectionChartY = writer.getY();
    if (section.pillar) {
      const metric = scoring.pillarMetrics[section.pillar];
      const sectionAccent = pillarColors[section.pillar];
      drawMetricBarChart(
        pdf,
        PAGE_MARGIN,
        sectionChartY,
        CONTENT_WIDTH,
        `Indicadores de ${section.title}`,
        [
          { label: "Total", value: metric.total, color: sectionAccent },
          { label: "Autopercepción", value: metric.likert, color: resolvedBranding.accent },
          { label: "Juicio situacional", value: metric.sjt, color: shade(resolvedBranding.primary, 0.45) },
        ],
        resolvedBranding,
      );

      const competenciesY = sectionChartY + 52;
      const comps = scoring.compList.filter((c) => c.pillar === section.pillar);
      drawMetricBarChart(
        pdf,
        PAGE_MARGIN,
        competenciesY,
        CONTENT_WIDTH,
        "Competencias del pilar",
        comps.map((c) => ({
          label: c.name,
          value: Math.round(((c.score - 1) / 4) * 100),
          color: sectionAccent,
        })),
        resolvedBranding,
      );

      const compHeight = Math.max(34, 16 + comps.length * 10);
      writer.setY(competenciesY + compHeight + 6);
    } else {
      drawRoundedCard(pdf, PAGE_MARGIN, sectionChartY, CONTENT_WIDTH, 68, [255, 255, 255]);
      pdf.setFont(resolvedBranding.font.family, "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(resolvedBranding.muted[0], resolvedBranding.muted[1], resolvedBranding.muted[2]);
      pdf.text("Mapa global del diagnóstico", PAGE_MARGIN + 4, sectionChartY + 7);
      drawGlobalRadarChart(pdf, PAGE_MARGIN + 56, sectionChartY + 9, 66, scoring, resolvedBranding);
      writer.setY(sectionChartY + 74);
    }

    const blocks = normalizeMarkdownText(resolvedReports[section.key] ?? "");
    for (const block of blocks) {
      if (block.type === "heading") {
        writer.writeHeading(block.text, "subsection");
      } else {
        writer.writeRichLines(block.text, {
          fontSize: 11,
          color: resolvedBranding.body,
          lineHeight: BODY_LINE_HEIGHT,
          gapAfter: BODY_GAP,
        });
      }
    }
  }

  pdf.save(`Descubrimiento_4Shine_${sanitizeParticipantName(participantName) || "usuario"}.pdf`);
}
