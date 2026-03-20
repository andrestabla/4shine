"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { COMP_DEFINITIONS, PILLAR_INFO } from "./DiagnosticsData";
import {
  buildDiscoveryReports,
  getDiscoveryStatus,
} from "./reporting";
import type {
  DiscoveryPillarKey,
  DiscoveryScoreResult,
  DiscoveryUserState,
} from "./types";

interface PdfReportDataProps {
  state: DiscoveryUserState;
  scoring: DiscoveryScoreResult;
}

export const PdfReportData = React.forwardRef<HTMLDivElement, PdfReportDataProps>(
  function PdfReportData({ state, scoring }, ref) {
    const reports = buildDiscoveryReports(state, scoring);
    const radarData = [
      {
        subject: "Within",
        value: scoring.pillarMetrics.within.total,
        fullMark: 100,
      },
      { subject: "Out", value: scoring.pillarMetrics.out.total, fullMark: 100 },
      { subject: "Up", value: scoring.pillarMetrics.up.total, fullMark: 100 },
      {
        subject: "Beyond",
        value: scoring.pillarMetrics.beyond.total,
        fullMark: 100,
      },
    ];
    const pillars: DiscoveryPillarKey[] = ["within", "out", "up", "beyond"];
    const globalStatus = getDiscoveryStatus(scoring.globalIndex);

    return (
      <div
        ref={ref}
        className="bg-white px-10 py-12 text-slate-900"
        style={{ width: "210mm" }}
      >
        <section className="mb-10 border-b border-slate-200 pb-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Descubrimiento 4Shine
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            Reporte ejecutivo de liderazgo
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {state.name} · {state.role}
          </p>
        </section>

        <section className="mb-10 rounded-[24px] border border-slate-200 bg-slate-50 px-8 py-8">
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

        <section className="mb-10 rounded-[24px] border border-slate-200 px-6 py-6">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Mapa global de pilares
          </p>
          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
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
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mb-12 rounded-[24px] border border-slate-200 px-7 py-7">
          <h2 className="text-xl font-black text-slate-900">
            Lectura general
          </h2>
          <div className="prose prose-slate mt-4 max-w-none text-sm leading-7">
            <ReactMarkdown>{reports.all}</ReactMarkdown>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-black text-slate-900">
            Desglose por competencia
          </h2>
          <table className="mt-5 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                <th className="py-3">Competencia</th>
                <th className="py-3">Pilar</th>
                <th className="py-3 text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {scoring.compList.map((item) => (
                <tr key={`${item.pillar}-${item.name}`} className="border-b border-slate-100">
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {COMP_DEFINITIONS[item.name] ?? "Competencia clave del diagnóstico 4Shine."}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-slate-600">
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

        {pillars.map((pillar) => {
          const metric = scoring.pillarMetrics[pillar];
          const status = getDiscoveryStatus(metric.total);
          const pillarRadarData = scoring.compList
            .filter((item) => item.pillar === pillar)
            .map((item) => ({
              subject:
                item.name.length > 18
                  ? `${item.name.slice(0, 18)}…`
                  : item.name,
              value: Math.round(((item.score - 1) / 4) * 100),
              fullMark: 100,
            }));

          return (
            <section key={pillar} className="mb-12 rounded-[24px] border border-slate-200 px-7 py-7">
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

              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_220px] gap-6">
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
                  <div className="prose prose-slate mt-5 max-w-none text-sm leading-7">
                    <ReactMarkdown>{reports[pillar]}</ReactMarkdown>
                  </div>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
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
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    );
  },
);

