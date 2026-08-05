# Material gráfico de 4Shine

Kit visual interno para **entender la plataforma 4Shine** de un vistazo: esquemas, tablas,
infografías, íconos y logo. Pensado para onboarding, presentaciones y documentación.

> Abre **`index.html`** en el navegador para ver todo el material en una sola galería.

## Marca

| Token | Valor |
|-------|-------|
| Navy primario | `#0D1B2A` |
| Navy secundario | `#1A1F2B` |
| Dorado (acento) | `#D4AF37` |
| Dorado claro | `#E8CE86` |
| Tipografía | Manrope |
| Isotipo | El "4" triangular + diamante + destello |

## Contenido

### `logo/` — Logo oficial (PNG, del Manual de marca)
- `4shine-logo-amarillo.png` — logo dorado (uso sobre fondo oscuro).
- `4shine-logo-blanco.png` — logo blanco.
- `4shine-logo-negro.png` — logo negro (uso sobre fondo claro).
- `4shine-logo-mixto.png` — versión mixta.
- `4shine-isotipo-amarillo.png` — solo el isotipo (marca sin texto).
- `favicon.png` — favicon.

### `diagramas/` — Esquemas e infografías (SVG, autocontenidos)
- `00-portada.svg` — Portada del kit.
- `01-arquitectura.svg` — Arquitectura de alto nivel: navegador → Vercel/Next.js → Neon, R2 y servicios externos.
- `02-esquemas-bd.svg` — Esquemas de PostgreSQL (`app_core` como núcleo y sus satélites).
- `03-ciclo-peticion.svg` — Ciclo de vida de una petición (del cliente al borde, API, permisos, servicio y RLS).
- `04-mapa-subsistemas.svg` — Mapa de subsistemas (sitio público, dashboard, webhooks, R2/SCORM, realtime, certificados, sesión).
- `05-recorrido-5-fases.svg` — El recorrido del programa: Descubrimiento → Shine Within → Shine Out → Shine Up → Shine Beyond.
- `06-roles-permisos.svg` — Los 5 roles del sistema y sus capacidades.
- `07-modelo-acceso.svg` — Cómo se decide el acceso: permiso de rol + gating por plan.
- `08-stack-tecnologico.svg` — Stack: frontend, backend, datos e integraciones.

### `iconos/`
- `modulos.svg` — Hoja de íconos de los módulos de 4Shine.

### `metodologia/` — 4Shine como sistema, metodología y marco (SVG)
Derivado del material fuente en `Documentos/Entradas/` (Dossier Final v6, Mapa de competencias V3,
Roadmap Camino del Líder, Shine Up Frameworks, Diseño de prueba diagnóstica).
- `10-marco-4shine.svg` — El marco: los 4 pilares (Shine Within / Out / Up / Beyond) y la pregunta que responde cada uno; el "diamante" como esquema madre.
- `11-arquitectura-competencias.svg` — Expansión concéntrica del modelo: **4 pilares · 22 componentes · 47 competencias · 96 conductas observables**.
- `12-mapa-competencias.svg` — Mapa completo de competencias por pilar y componente (nombres del Mapa de competencias V3).
- `13-camino-del-lider.svg` — El Camino del Líder: roadmap de **24 semanas** (10 workbooks, 12 mentorías, 2 diagnósticos).
- `14-ritmo-semanal.svg` — El ritmo semanal en tres tiempos: Antes (workbook) → Durante (mentoría) → Después (práctica).
- `15-diagnostico.svg` — El Diagnóstico de Liderazgo 4Shine: 125 ítems (Likert + SJT), distribución por pilar y semáforo de resultados.
- `16-frameworks.svg` — Las 11 herramientas prácticas que operan la metodología (ecosistema relacional, capacity matrix, etc.).
- `17-tres-redes.svg` — Ecosistema Relacional: las 3 redes (Personal / Operativa / Estratégica) y los 5 roles.
- `18-matriz-stakeholders.svg` — Análisis de Influencia e Impacto: matriz 2×2 (Influencia × Relación).
- `19-capacity-matrix.svg` — Expansion Capacity Matrix: 6 dimensiones × 4 pilares, escala 1–5.
- `20-workbooks-entregables.svg` — Los 10 workbooks (WB1–WB10) con su entregable esperado, por pilar.
- `21-fundamentos.svg` — Los modelos/marcos académicos que cada pilar integra (Bandura, Dweck, Goleman, Ikigai, Sinek, Senge…).
- `22-principios-y-roles.svg` — Los 6 principios de diseño del programa y los roles de mentoría (Mentor Guía / Experto / Speakers).
- `23-triple-capa.svg` — Un solo eje, tres lecturas: marco (pilar) ↔ formación (fase) ↔ cronograma (semanas).
- **`conductas-observables.html`** — El detalle fino: las **96 conductas observables** ("El líder…") agrupadas por pilar → componente → competencia. Texto literal del Mapa V3. Ábrelo en el navegador.

> **Nota de dato:** la taxonomía usa **47 competencias** (Dossier v6 + Mapa V3). El documento de diagnóstico
> menciona 48; difieren en 1. Se adoptó 47 por ser la cifra concordante entre las dos fuentes primarias.

## Notas
- Los SVG son **autocontenidos** (colores en hex, sin CSS externo): se abren en cualquier navegador o se incrustan donde sea.
- Los diagramas técnicos (`01`–`04`) derivan de la documentación viva en
  `src/features/documentacion/content.ts`; si esa documentación cambia, conviene regenerarlos.
