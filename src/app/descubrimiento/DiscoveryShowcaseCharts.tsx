"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from "recharts";

const RADAR_DATA = [
  { pillar: "Shine Within", score: 72 },
  { pillar: "Shine Out", score: 58 },
  { pillar: "Shine Up", score: 81 },
  { pillar: "Shine Beyond", score: 65 },
];

const COMPETENCY_SAMPLE = [
  // Within
  { name: "Autoconciencia emocional", score: 78, pillar: "within" },
  { name: "Autoeficacia y seguridad", score: 72, pillar: "within" },
  { name: "Claridad de propósito", score: 74, pillar: "within" },
  { name: "Integridad y coherencia", score: 80, pillar: "within" },
  // Out
  { name: "Claridad e inspiración", score: 62, pillar: "out" },
  { name: "Escucha activa y empática", score: 64, pillar: "out" },
  { name: "Construcción de confianza", score: 55, pillar: "out" },
  { name: "Influencia ética", score: 52, pillar: "out" },
  // Up
  { name: "Pensamiento estratégico", score: 85, pillar: "up" },
  { name: "Visión compartida", score: 82, pillar: "up" },
  { name: "Decisión bajo incertidumbre", score: 76, pillar: "up" },
  { name: "Agilidad y adaptabilidad", score: 79, pillar: "up" },
  // Beyond
  { name: "Empoderamiento de equipos", score: 65, pillar: "beyond" },
  { name: "Ética y responsabilidad", score: 72, pillar: "beyond" },
  { name: "Legado personal", score: 55, pillar: "beyond" },
  { name: "Liderazgo de servicio", score: 63, pillar: "beyond" },
];

const PILLAR_COLORS: Record<string, string> = {
  within: "#7c5f93",
  out: "#6a9fd8",
  up: "#9d79c8",
  beyond: "#d48ab4",
};

const PILLAR_LABELS: Record<string, string> = {
  within: "Shine Within",
  out: "Shine Out",
  up: "Shine Up",
  beyond: "Shine Beyond",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string; pillar: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-[#d8cfee] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#301b48]">{item.payload.name}</p>
      <p className="mt-0.5 text-[#7557a1]">{PILLAR_LABELS[item.payload.pillar]} · {item.value}/100</p>
    </div>
  );
}

export function DiscoveryRadarChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(99,72,126,0.12)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: "#5f4c78", fontSize: 11, fontWeight: 700 }}
          />
          <Radar
            name="Resultado ejemplo"
            dataKey="score"
            stroke="#7c5f93"
            fill="#7c5f93"
            fillOpacity={0.22}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiscoveryCompetenciesChart() {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={COMPETENCY_SAMPLE}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          barSize={9}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#8c7aab", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tick={{ fill: "#5f4c78", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,72,126,0.04)" }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {COMPETENCY_SAMPLE.map((entry) => (
              <Cell key={entry.name} fill={PILLAR_COLORS[entry.pillar]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GlobalIndexDisplay() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[6px] border-[#e9e0f5] bg-white shadow-[0_8px_32px_rgba(99,72,126,0.14)]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#7c5f93 0% 70%, transparent 70% 100%)`,
            borderRadius: "50%",
            opacity: 0.18,
          }}
        />
        <div className="text-center">
          <p className="text-[3rem] font-black leading-none text-[#2f1a47]">70</p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8a76a3]">/ 100</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-[#301b48]">Índice global de liderazgo</p>
        <p className="mt-0.5 text-xs text-[#7557a1]">Ejemplo · Perfil real variará</p>
      </div>
    </div>
  );
}

export function PillarScoreBars() {
  const pillars = [
    { label: "Shine Within", score: 72, color: "#7c5f93" },
    { label: "Shine Out", score: 58, color: "#6a9fd8" },
    { label: "Shine Up", score: 81, color: "#9d79c8" },
    { label: "Shine Beyond", score: 65, color: "#d48ab4" },
  ];
  return (
    <div className="space-y-3">
      {pillars.map((p) => (
        <div key={p.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4a3a66]">{p.label}</span>
            <span className="text-xs font-bold text-[#7557a1]">{p.score}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#ede6f7]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${p.score}%`, backgroundColor: p.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
