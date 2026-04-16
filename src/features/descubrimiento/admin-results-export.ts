"use client";

import { utils, writeFile } from "xlsx";
import { DB, PILLAR_INFO, SCALES } from "./DiagnosticsData";
import type {
  DiscoveryOverviewDetailPayload,
  DiscoveryOverviewRow,
} from "./types";

const PILLAR_LABELS = {
  within: PILLAR_INFO.within.title,
  out: PILLAR_INFO.out.title,
  up: PILLAR_INFO.up.title,
  beyond: PILLAR_INFO.beyond.title,
} as const;

function sanitizeFileSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveAnswerLabel(
  questionId: string | number,
  rawValue: string | number | undefined,
): { answer: string; score: string | number } {
  const numericQuestionId = Number(questionId);
  const question = DB.find((item) => item.id === numericQuestionId);
  if (!question || rawValue === undefined || rawValue === null || rawValue === "") {
    return { answer: "-", score: "" };
  }

  if (question.type === "likert") {
    const numeric = Number(rawValue);
    const labels = SCALES[question.scale ?? "freq"];
    const label =
      Number.isFinite(numeric) && numeric >= 1 && numeric <= labels.length
        ? labels[numeric - 1]
        : String(rawValue);
    return {
      answer: `${rawValue} · ${label}`,
      score: Number.isFinite(numeric) ? numeric : "",
    };
  }

  const option = question.options?.find((item) => item.id === String(rawValue));
  if (!option) {
    return { answer: String(rawValue), score: "" };
  }
  return {
    answer: `${option.id} · ${option.text}`,
    score: option.weight,
  };
}

export function downloadDiscoveryRowResultsWorkbook(
  row: DiscoveryOverviewRow,
  detail: DiscoveryOverviewDetailPayload,
): void {
  const workbook = utils.book_new();

  const summarySheet = utils.json_to_sheet([
    { Campo: "Diagnóstico", Valor: row.diagnosticIdentifier },
    { Campo: "Tipo", Valor: row.sourceType === "invited" ? "Invitado" : "Plataforma" },
    { Campo: "Participante", Valor: row.participantName },
    { Campo: "Correo", Valor: row.invitedEmail || "-" },
    { Campo: "País", Valor: row.country || "-" },
    { Campo: "Cargo", Valor: row.jobRole || "-" },
    { Campo: "Edad", Valor: row.age ?? "-" },
    { Campo: "Experiencia", Valor: row.yearsExperience ?? "-" },
    { Campo: "Avance", Valor: `${row.completionPercent}%` },
    { Campo: "Índice global", Valor: detail.scoring.globalIndex },
    {
      Campo: "Satisfacción",
      Valor:
        detail.experienceSurvey?.average !== undefined
          ? `${detail.experienceSurvey.average}/5`
          : "-",
    },
    {
      Campo: "Fecha actualización",
      Valor: new Date(row.updatedAt).toLocaleString("es-CO"),
    },
  ]);
  utils.book_append_sheet(workbook, summarySheet, "Resumen");

  const pillarsSheet = utils.json_to_sheet(
    (Object.entries(detail.scoring.pillarMetrics) as Array<
      [keyof typeof detail.scoring.pillarMetrics, (typeof detail.scoring.pillarMetrics)[keyof typeof detail.scoring.pillarMetrics]]
    >).map(([pillar, metrics]) => ({
      Pilar: PILLAR_LABELS[pillar],
      Total: metrics.total,
      Autopercepcion: metrics.likert,
      JuicioSituacional: metrics.sjt,
      Brecha: metrics.likert - metrics.sjt,
    })),
  );
  utils.book_append_sheet(workbook, pillarsSheet, "Pilares");

  const competenciesSheet = utils.json_to_sheet(
    detail.scoring.compList.map((item) => ({
      Pilar: PILLAR_LABELS[item.pillar],
      Competencia: item.name,
      Score_1_5: item.score,
      Equivalente_0_100: Math.round(((item.score - 1) / 4) * 100),
    })),
  );
  utils.book_append_sheet(workbook, competenciesSheet, "Competencias");

  const surveySheet = utils.json_to_sheet(
    detail.experienceSurvey
      ? Object.entries(detail.experienceSurvey.answers).map(([question, value]) => ({
          Pregunta: question,
          Respuesta: value,
        }))
      : [{ Pregunta: "Sin respuestas de satisfacción", Respuesta: "" }],
  );
  utils.book_append_sheet(workbook, surveySheet, "Satisfaccion");

  const answersSheet = utils.json_to_sheet(
    DB.map((question) => {
      const rawValue = detail.state.answers[String(question.id)];
      const resolved = resolveAnswerLabel(question.id, rawValue);
      return {
        ID: question.id,
        Pilar: PILLAR_LABELS[question.pillar],
        Competencia: question.comp,
        Tipo: question.type === "likert" ? "Autoinforme" : "Situacional",
        Pregunta: question.text,
        Respuesta: resolved.answer,
        Puntaje: resolved.score,
      };
    }),
  );
  utils.book_append_sheet(workbook, answersSheet, "Respuestas");

  const fileName = `${sanitizeFileSegment(row.diagnosticIdentifier || row.participantName || "resultados")}_resultados.xls`;
  writeFile(workbook, fileName, { bookType: "xls" });
}
