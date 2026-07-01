# Backlog consolidado — Auditoría UX/UI 360

Hallazgos transversales a los 6 personas (líder sin plan, líder con plan, advisor/mentor, gestor, admin, invitado), priorizados para implementación. Cada tema agrupa hallazgos repetidos en varios roles.

Leyenda esfuerzo: 🟢 quick win · 🟡 mediano · 🔴 proyecto.

> **Estado de implementación (en producción):** ✅ **B1–B14 y B16 implementados y desplegados.** B15 no aplica (no existe botón de eliminar usuario por fila; la baja va por otra vía). Solo queda **P3** (pulido opcional: paginación en convocatorias/workshops, tablas 360 responsive en móvil, etc.).

## 🔴 P1 — Prioridad alta (impacto en conversión/experiencia/seguridad)

| # | Tema | Personas afectadas | Recomendación | Esfuerzo |
|---|---|---|---|---|
| B1 | **El menú no señala módulos inaccesibles** (bloqueados por plan o por permiso) → clic = muro sorpresa | líder sin plan, líder con plan, gestor | Marcar en el sidebar los ítems fuera de acceso con 🔒/badge (o `viewerTier`-aware). Decidir qué mostrar vs. ocultar por rol. | 🟢 |
| B2 | **`ModuleLockedScreen` no es consciente del plan** (features estáticas, CTA genérico) | líder sin plan, líder con plan | Pasar `missingFeatures` + plan objetivo; personalizar "qué te falta y qué plan lo desbloquea". `?from=<módulo>`. | 🟡 |
| B3 | **Ruta de conversión fragmentada**: CTAs salen al sitio público `/planes-precios`; `/dashboard/suscripcion` queda huérfano | líder sin plan (y con plan) | Unificar una sola ruta de conversión, idealmente **dentro** del dashboard, enlazada desde menú/header. | 🟡 |
| B4 | **Estados vacíos pobres** (`EmptyState` = `<p>{message}</p>`) sin ícono/CTA → dead-ends | líder con plan, gestor, advisor | Mejorar el componente `EmptyState` global (ícono + copy humano + acción). | 🟢 |
| B5 | **Cadencia de mentorías 1:1 (10 días) mal comunicada** → "bloqueada" se confunde con "consumida" | líder con plan, advisor | Banner + **fecha exacta de desbloqueo** por sesión; explicar la regla en el módulo. | 🟡 |
| B6 | **Admin: acceso a `/administracion` sin guardia de cliente** (gestor ve la superficie admin por URL) | gestor | Guard en cliente (`can('usuarios','manage')`) con redirect/403. | 🟢 |
| B7 | **Menú ↔ permiso incoherente** (gestor tiene Usuarios pero está oculto; admin sin breadcrumbs/jerarquía) | gestor, admin | Exponer/retirar según decisión de producto; añadir breadcrumbs + submenú en admin. | 🟡 |

## 🟠 P2 — Prioridad media (consistencia y fricción)

| # | Tema | Personas | Recomendación | Esfuerzo |
|---|---|---|---|---|
| B8 | **Patrones de bloqueo inconsistentes**: `ModuleLockedScreen` vs empty-state custom (Aprendizaje) vs redirect silencioso (invitado) | líder sin plan, invitado | Unificar en un único patrón/componente (incl. variante inline). | 🟡 |
| B9 | **Microcopy inconsistente** ("se desbloquea" variantes; CTA "Ver planes" vs "Elegir plan"; "Módulo bloqueado") | todos | Guía de voz + un solo término de marca ("Activar plan 4Shine"); `footnote` en todos los muros. | 🟢 |
| B10 | **Feedback de acciones ausente/asimétrico**: rechazo de convocatoria sin toast; Zoom creado sin confirmación; export sin spinner; stats "0" ambiguos | gestor, advisor | Toasts simétricos éxito/error, spinners, y "—/Sin datos" en métricas vacías. | 🟢 |
| B11 | **Home no muestra plan ni vencimiento** (subscriber) | líder con plan | "Plan X · vigente hasta DD/MM" + link a suscripción. | 🟢 |
| B12 | **Networking: pestaña "Mensajes" es un redirect** (parece roto) | líder con plan, advisor | Quitar la pestaña; dejar CTA "Enviar mensaje". | 🟢 |
| B13 | **Dead-ends cuando falta un recurso**: agendar 1:1 sin franjas; post-diagnóstico del invitado sin "qué sigue" | advisor, invitado | Alternativas: "Contactar advisor" / "Solicitar disponibilidad"; panel de cierre con CTA de continuidad. | 🟡 |
| B14 | **Admin: acciones masivas sin revisión previa** (riesgo a escala) | admin | Modal de *review* (afectados + parámetros) y/o modo dry-run. | 🟡 |
| B15 | **Permisos incompletos que rompen el flujo** (gestor crea usuarios pero no elimina) | gestor | Otorgar `delete` o explicar la limitación en UI. | 🟢 |
| B16 | **Banderas de acceso contradictorias del invitado** (`canAccessAprendizajeRecursosFree` vs `freeLearningOnly`; `viewerTier:'staff'`) | invitado | Auditar y unificar el bootstrap del invitado. | 🟢 |

## 🟡 P3 — Pulido / oportunidades
- Formularios admin muy densos (Branding "Login", Usuarios) → dividir/wizard; validación hex inline; preview en vivo del Tour; búsqueda/paginación en Site. (admin)
- Paginación/"cargar más" en Convocatorias y Workshops. (líder con plan)
- Diagnóstico "0%" → "No iniciado"; rotación de frase con timezone. (líder)
- Extracción de CV con preview; métricas de cursos para el autor; autosave de borrador en mensajes; tablas 360 responsive. (advisor)
- Hub admin: agrupar tarjetas por categoría; features cuantificadas en muros. (admin, líder)

## Top 5 recomendado para empezar (mayor ROI / menor esfuerzo)
1. **B1** — señalizar módulos bloqueados en el menú (🟢).
2. **B10** — feedback de acciones (toasts/spinners/"sin datos") (🟢).
3. **B6** — guard de cliente en `/administracion` (🟢).
4. **B4** — mejorar `EmptyState` global (🟢).
5. **B5** — comunicar la cadencia de mentorías con fecha de desbloqueo (🟡).

## Temas estructurales (más impacto, más esfuerzo)
- **B2 + B3**: repensar la arquitectura de conversión (muros conscientes del plan + una sola ruta de upgrade dentro del dashboard). Es el mayor apalancamiento de negocio.
- **B7**: jerarquía/orientación del admin (breadcrumbs + submenú) conforme crece.
