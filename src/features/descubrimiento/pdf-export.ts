"use client";

import { jsPDF } from "jspdf";
import { PILLAR_INFO } from "./DiagnosticsData";
import { buildDiscoveryReports, getDiscoveryStatus } from "./reporting";
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
}

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH_MM - PAGE_MARGIN * 2;
const BODY_LINE_HEIGHT = 5.8;
const BODY_GAP = 3.2;

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
      if (block.startsWith("## ")) {
        return { type: "heading" as const, text: block.replace(/^##\s+/, "").trim() };
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

function buildWriter(pdf: jsPDF) {
  let currentY = PAGE_MARGIN;

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
      color = [46, 40, 76],
      lineHeight = BODY_LINE_HEIGHT,
      gapAfter = BODY_GAP,
      x = PAGE_MARGIN,
      width = CONTENT_WIDTH,
    } = options ?? {};

    pdf.setFont("helvetica", fontStyle);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, x, currentY);
      currentY += lineHeight;
    }
    currentY += gapAfter;
  };

  const writeHeading = (
    text: string,
    level: "kicker" | "title" | "section" | "subsection" = "section",
  ) => {
    const config =
      level === "kicker"
        ? { size: 10, color: [120, 109, 150] as [number, number, number], lineHeight: 4.6, gap: 3.5 }
        : level === "title"
          ? { size: 24, color: [33, 24, 67] as [number, number, number], lineHeight: 8.2, gap: 5.5 }
          : level === "section"
            ? { size: 17, color: [33, 24, 67] as [number, number, number], lineHeight: 6.5, gap: 4.5 }
            : { size: 12.5, color: [70, 58, 104] as [number, number, number], lineHeight: 5.2, gap: 2.8 };

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
  };
}

function drawGlobalRadarChart(
  pdf: jsPDF,
  x: number,
  y: number,
  size: number,
  scoring: DiscoveryScoreResult,
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
  pdf.setDrawColor(224, 220, 237);
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
  pdf.setFillColor(219, 211, 246);
  pdf.setDrawColor(49, 26, 117);
  for (let index = 0; index < chartPoints.length; index += 1) {
    const start = chartPoints[index];
    const end = chartPoints[(index + 1) % chartPoints.length];
    pdf.line(start.x, start.y, end.x, end.y);
    pdf.circle(start.x, start.y, 1.2, "F");
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(87, 74, 123);
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
) {
  const cardHeight = Math.max(34, 16 + values.length * 10);
  drawRoundedCard(pdf, x, y, width, cardHeight, [255, 255, 255]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(44, 38, 74);
  pdf.text(title, x + 4, y + 7);

  values.forEach((entry, index) => {
    const rowY = y + 13 + index * 10;
    const barX = x + 54;
    const barWidth = width - 68;
    const scoreX = x + width - 5;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(98, 90, 125);
    pdf.text(entry.label, x + 4, rowY);

    pdf.setFillColor(239, 236, 247);
    pdf.roundedRect(barX, rowY - 3.5, barWidth, 4.5, 2, 2, "F");
    pdf.setFillColor(...entry.color);
    pdf.roundedRect(barX, rowY - 3.5, (barWidth * Math.max(0, Math.min(100, entry.value))) / 100, 4.5, 2, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(44, 38, 74);
    pdf.text(`${entry.value}%`, scoreX, rowY, { align: "right" });
  });
}

export async function downloadDiscoveryPdfReport({
  participantName,
  state,
  scoring,
  reports,
}: DownloadDiscoveryPdfInput): Promise<void> {
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const writer = buildWriter(pdf);
  const resolvedReports = reports ?? {};
  const globalStatus = getDiscoveryStatus(scoring.globalIndex);
  const pillars: DiscoveryPillarKey[] = ["within", "out", "up", "beyond"];
  const generatedAt = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  writer.writeHeading("DIAGNÓSTICO 4SHINE", "kicker");
  writer.writeHeading("Reporte ejecutivo de liderazgo", "title");
  writer.writeWrappedLines(participantName, {
    fontSize: 12,
    color: [100, 89, 128],
    lineHeight: 5.2,
    gapAfter: 3.5,
  });
  writer.writeWrappedLines(`Generado: ${generatedAt}`, {
    fontSize: 9.5,
    color: [136, 126, 159],
    lineHeight: 4.3,
    gapAfter: 6,
  });

  const summaryCardY = writer.getY();
  drawRoundedCard(pdf, PAGE_MARGIN, summaryCardY, CONTENT_WIDTH, 24, [249, 248, 252]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(138, 127, 160);
  pdf.text("ÍNDICE GLOBAL", PAGE_MARGIN + 6, summaryCardY + 7);
  pdf.setFontSize(30);
  pdf.setTextColor(49, 26, 117);
  pdf.text(`${scoring.globalIndex}%`, PAGE_MARGIN + 6, summaryCardY + 18);
  pdf.setFillColor(255, 243, 232);
  pdf.roundedRect(PAGE_MARGIN + CONTENT_WIDTH - 42, summaryCardY + 7, 34, 8, 4, 4, "F");
  pdf.setFontSize(9);
  pdf.setTextColor(210, 98, 28);
  pdf.text(globalStatus.label.toUpperCase(), PAGE_MARGIN + CONTENT_WIDTH - 25, summaryCardY + 12.2, {
    align: "center",
  });
  writer.setY(summaryCardY + 31);

  writer.writeHeading("Mapa global de pilares", "section");
  const chartRowY = writer.getY();
  drawRoundedCard(pdf, PAGE_MARGIN, chartRowY, 84, 68, [255, 255, 255]);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(122, 112, 149);
  pdf.text("Radar global", PAGE_MARGIN + 4, chartRowY + 7);
  drawGlobalRadarChart(pdf, PAGE_MARGIN + 8, chartRowY + 10, 66, scoring);

  const rightX = PAGE_MARGIN + 90;
  drawMetricBarChart(
    pdf,
    rightX,
    chartRowY,
    CONTENT_WIDTH - 90,
    "Resumen por pilar",
    pillars.map((pillar, index) => ({
      label: PILLAR_INFO[pillar].title,
      value: scoring.pillarMetrics[pillar].total,
      color:
        index === 0
          ? ([85, 61, 185] as [number, number, number])
          : index === 1
            ? ([128, 94, 219] as [number, number, number])
            : index === 2
              ? ([220, 122, 44] as [number, number, number])
              : ([185, 128, 75] as [number, number, number]),
      })),
  );
  writer.setY(chartRowY + 76);

  const reportSections: Array<{ key: keyof typeof resolvedReports; title: string; pillar?: DiscoveryPillarKey }> = [
    { key: "all", title: "Visión general" },
    { key: "within", title: PILLAR_INFO.within.title, pillar: "within" },
    { key: "out", title: PILLAR_INFO.out.title, pillar: "out" },
    { key: "up", title: PILLAR_INFO.up.title, pillar: "up" },
    { key: "beyond", title: PILLAR_INFO.beyond.title, pillar: "beyond" },
  ];

  for (const [index, section] of reportSections.entries()) {
    if (index > 0) {
      writer.startNewPage();
    }
    writer.writeHeading(section.title, "section");

    const sectionChartY = writer.getY();
    if (section.pillar) {
      const metric = scoring.pillarMetrics[section.pillar];
      drawMetricBarChart(pdf, PAGE_MARGIN, sectionChartY, CONTENT_WIDTH, `Indicadores de ${section.title}`, [
        { label: "Total", value: metric.total, color: [85, 61, 185] },
        { label: "Autopercepción", value: metric.likert, color: [220, 122, 44] },
        { label: "Juicio situacional", value: metric.sjt, color: [124, 111, 163] },
      ]);
      
      const competenciesY = sectionChartY + 52;
      const comps = scoring.compList.filter((c) => c.pillar === section.pillar);
      drawMetricBarChart(pdf, PAGE_MARGIN, competenciesY, CONTENT_WIDTH, "Competencias del pilar", comps.map((c) => ({
        label: c.name,
        value: Math.round(((c.score - 1) / 4) * 100),
        color: [124, 111, 163] as [number, number, number]
      })));
      
      const compHeight = Math.max(34, 16 + comps.length * 10);
      writer.setY(competenciesY + compHeight + 6);
    } else {
      drawRoundedCard(pdf, PAGE_MARGIN, sectionChartY, CONTENT_WIDTH, 68, [255, 255, 255]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(122, 112, 149);
      pdf.text("Mapa global del diagnóstico", PAGE_MARGIN + 4, sectionChartY + 7);
      drawGlobalRadarChart(pdf, PAGE_MARGIN + 56, sectionChartY + 9, 66, scoring);
      writer.setY(sectionChartY + 74);
    }

    const blocks = normalizeMarkdownText(resolvedReports[section.key] ?? "");
    for (const block of blocks) {
      if (block.type === "heading") {
        writer.writeHeading(block.text, "subsection");
      } else {
        writer.writeWrappedLines(block.text, {
          fontSize: 11,
          color: [46, 40, 76],
          lineHeight: BODY_LINE_HEIGHT,
          gapAfter: BODY_GAP,
        });
      }
    }
  }

  pdf.save(`Descubrimiento_4Shine_${sanitizeParticipantName(participantName) || "usuario"}.pdf`);
}
