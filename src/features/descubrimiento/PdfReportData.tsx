"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import { COMP_DEFINITIONS, PILLAR_INFO } from "./DiagnosticsData";
import { buildDiscoveryReports, getDiscoveryStatus } from "./reporting";
import type {
  DiscoveryAiReports,
  DiscoveryPillarKey,
  DiscoveryScoreResult,
  DiscoveryUserState,
} from "./types";

interface PdfReportDataProps {
  state: DiscoveryUserState;
  scoring: DiscoveryScoreResult;
  reports?: DiscoveryAiReports | null;
}

const PDF_PAGE_WIDTH = 794;
const PDF_PAGE_MIN_HEIGHT = 1123;
const GLOBAL_REPORT_CHARS_PER_PAGE = 2200;
const PILLAR_FIRST_PAGE_CHARS = 1300;
const PILLAR_CONTINUED_PAGE_CHARS = 2300;

function chunkArray<T>(items: T[], size: number): T[][];
function chunkArray<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function PdfPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section
      data-pdf-page="true"
      className="mb-6 overflow-hidden border border-slate-200 bg-white text-slate-900"
      style={{
        width: `${PDF_PAGE_WIDTH}px`,
        minHeight: `${PDF_PAGE_MIN_HEIGHT}px`,
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      {children}
    </section>
  );
}

function ReportMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none text-[14px] leading-[1.72]">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function splitOversizedBlock(block: string, maxChars: number): string[] {
  if (block.length <= maxChars) return [block];
  const sentences = block.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [block];
  const output: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    const candidate = current ? `${current} ${trimmedSentence}` : trimmedSentence;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) output.push(current);
    current = trimmedSentence;
  }

  if (current) output.push(current);
  return output;
}

function splitMarkdownIntoChunks(content: string, maxChars: number): string[] {
  const normalized = content.trim().replace(/\r/g, "");
  if (!normalized) return [];

  const sections = normalized
    .split(/\n(?=##\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  const queue = sections.length > 0 ? sections : [normalized];
  const chunks: string[] = [];
  let current = "";

  for (const section of queue) {
    const blocks = section
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    const expandedBlocks = blocks.flatMap((block) => splitOversizedBlock(block, maxChars));

    for (const block of expandedBlocks) {
      const candidate = current ? `${current}\n\n${block}` : block;
      if (candidate.length <= maxChars) {
        current = candidate;
        continue;
      }
      if (current) chunks.push(current);
      current = block;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export const PdfReportData = React.forwardRef<HTMLDivElement, PdfReportDataProps>(
  function PdfReportData({ state, scoring, reports }, ref) {
    const resolvedReports = reports ?? {};
    const radarData = [
      { subject: "Within", value: scoring.pillarMetrics.within.total, fullMark: 100 },
      { subject: "Out", value: scoring.pillarMetrics.out.total, fullMark: 100 },
      { subject: "Up", value: scoring.pillarMetrics.up.total, fullMark: 100 },
      { subject: "Beyond", value: scoring.pillarMetrics.beyond.total, fullMark: 100 },
    ];
    const pillars: DiscoveryPillarKey[] = ["within", "out", "up", "beyond"];
    const globalStatus = getDiscoveryStatus(scoring.globalIndex);
    const competencyPages = chunkArray(scoring.compList, 16);
    const globalReportPages = splitMarkdownIntoChunks(
      resolvedReports.all ?? "",
      GLOBAL_REPORT_CHARS_PER_PAGE,
    );

    return (
      <div ref={ref} className="bg-white">
        <PdfPage>
          <section className="border-b border-slate-200 pb-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
              Descubrimiento 4Shine
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">
              Reporte ejecutivo de liderazgo
            </h1>
            <p className="mt-2 text-sm text-slate-500">{state.name}</p>
          </section>

          <section className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 px-8 py-8">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Índice global
                </p>
                <div className="mt-4 text-6xl font-black text-[var(--brand-primary)]">
                  {scoring.globalIndex}%
                </div>
              </div>
              <div
                className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
                style={{
                  color: globalStatus.color,
                  backgroundColor: globalStatus.softColor,
                }}
              >
                {globalStatus.label}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[24px] border border-slate-200 px-6 py-6">
            <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
              Mapa global de pilares
            </p>
            <div className="mt-4 flex justify-center">
              <RadarChart
                width={420}
                height={320}
                cx={210}
                cy={160}
                outerRadius={110}
                data={radarData}
              >
                <PolarGrid stroke="rgba(71,85,105,0.18)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Radar
                  dataKey="value"
                  stroke="var(--brand-primary)"
                  fill="var(--brand-primary)"
                  fillOpacity={0.16}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </div>
          </section>
          <section className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-[16px] border border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-[10px] font-black text-slate-900">Shine Within — La esencia</h3>
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                Evalúa el nivel de conexión del líder consigo mismo: sus creencias, emociones, valores, propósito e identidad. Refleja la base interna desde la cual toma decisiones, se regula y sostiene un liderazgo auténtico.
              </p>
            </div>
            <div className="rounded-[16px] border border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-[10px] font-black text-slate-900">Shine Out — Presencia estratégica</h3>
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                Evalúa la capacidad del líder para comunicar su valor, proyectar confianza y expresar su liderazgo con claridad, coherencia e impacto. Refleja cómo su presencia, narrativa y comunicación fortalecen su influencia profesional.
              </p>
            </div>
            <div className="rounded-[16px] border border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-[10px] font-black text-slate-900">Shine Up — Ecosistema relacional</h3>
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                Evalúa la capacidad del líder para construir relaciones estratégicas, generar confianza y activar redes de valor. Refleja cómo se vincula con otros, lee su entorno y crea oportunidades de colaboración e influencia.
              </p>
            </div>
            <div className="rounded-[16px] border border-slate-100 bg-slate-50/50 p-4">
              <h3 className="text-[10px] font-black text-slate-900">Shine Beyond — Legado</h3>
              <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                Evalúa la capacidad del líder para proyectar su liderazgo hacia el futuro, generar impacto sostenible y dejar una huella positiva en su organización y entorno. Refleja su visión, contribución y sentido de trascendencia.
              </p>
            </div>
          </section>
        </PdfPage>

        {globalReportPages.map((chunk, pageIndex) => (
          <PdfPage key={`global-report-${pageIndex}`}>
            <section className="rounded-[24px] border border-slate-200 px-7 py-7">
              <h2 className="text-xl font-black text-slate-900">
                {pageIndex === 0 ? "Lectura general" : "Lectura general (continuación)"}
              </h2>
              <div className="mt-5">
                <ReportMarkdown content={chunk} />
              </div>
            </section>
          </PdfPage>
        ))}

        {competencyPages.map((items, pageIndex) => (
          <PdfPage key={`competencies-${pageIndex}`}>
            <section>
              <h2 className="text-xl font-black text-slate-900">
                Desglose por competencia
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Página {pageIndex + 1} de {competencyPages.length}
              </p>
              <table className="mt-5 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    <th className="py-3 pr-4">Competencia</th>
                    <th className="py-3 pr-4">Pilar</th>
                    <th className="py-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.pillar}-${item.name}`} className="border-b border-slate-100 align-top">
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {COMP_DEFINITIONS[item.name] ?? "Competencia clave del diagnóstico 4Shine."}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-600">
                        {PILLAR_INFO[item.pillar].title}
                      </td>
                      <td className="py-4 text-center text-sm font-black text-slate-900">
                        {item.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </PdfPage>
        ))}

        {pillars.map((pillar) => {
          const metric = scoring.pillarMetrics[pillar];
          const status = getDiscoveryStatus(metric.total);
          const [firstPillarChunk = ""] = splitMarkdownIntoChunks(
            resolvedReports[pillar] ?? "",
            PILLAR_FIRST_PAGE_CHARS,
          );
          const normalizedPillarReport = (resolvedReports[pillar] ?? "").trim();
          const usedContent = firstPillarChunk.trim();
          const remainingContent = usedContent
            ? normalizedPillarReport.startsWith(usedContent)
              ? normalizedPillarReport.slice(usedContent.length).trim()
              : normalizedPillarReport.replace(usedContent, "").trim()
            : normalizedPillarReport;
          const continuedPillarChunks = splitMarkdownIntoChunks(
            remainingContent,
            PILLAR_CONTINUED_PAGE_CHARS,
          );
          const pillarRadarData = scoring.compList
            .filter((item) => item.pillar === pillar)
            .map((item) => ({
              subject: item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name,
              value: Math.round(((item.score - 1) / 4) * 100),
              fullMark: 100,
            }));

          return (
            <React.Fragment key={pillar}>
              <PdfPage>
                <section>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                        {PILLAR_INFO[pillar].sub}
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">
                        {PILLAR_INFO[pillar].title}
                      </h2>
                    </div>
                    <div
                      className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
                      style={{
                        color: status.color,
                        backgroundColor: status.softColor,
                      }}
                    >
                      {metric.total}%
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-[minmax(0,1fr)_280px] gap-6">
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                            Autopercepción
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-900">
                            {metric.likert}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                            Juicio situacional
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-900">
                            {metric.sjt}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-5">
                        <ReportMarkdown content={firstPillarChunk} />
                      </div>
                    </div>

                    <div className="flex items-center justify-center rounded-[20px] border border-slate-200 bg-white px-3 py-3">
                      <RadarChart
                        width={250}
                        height={250}
                        cx={125}
                        cy={125}
                        outerRadius={82}
                        data={pillarRadarData}
                      >
                        <PolarGrid stroke="rgba(71,85,105,0.18)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#475569", fontSize: 9, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                        <Radar
                          dataKey="value"
                          stroke="var(--brand-primary)"
                          fill="var(--brand-primary)"
                          fillOpacity={0.16}
                          strokeWidth={2.5}
                        />
                      </RadarChart>
                    </div>
                  </div>
                </section>
              </PdfPage>

              {continuedPillarChunks.map((chunk, continuationIndex) => (
                <PdfPage key={`${pillar}-continued-${continuationIndex}`}>
                  <section className="rounded-[24px] border border-slate-200 px-7 py-7">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                      {PILLAR_INFO[pillar].sub}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                      {PILLAR_INFO[pillar].title} · Continuación
                    </h2>
                    <div className="mt-5">
                      <ReportMarkdown content={chunk} />
                    </div>
                  </section>
                </PdfPage>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
