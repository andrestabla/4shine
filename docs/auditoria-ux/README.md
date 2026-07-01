# Auditoría UX/UI 360 — 4Shine

Simulación de navegación por **cada rol y plan** de la plataforma, basada en el comportamiento real del código (mismo gating que corre en vivo). Cada informe cubre: definición del persona, matriz de acceso por módulo, recorrido pantalla por pantalla y hallazgos priorizados (P1/P2/P3) con ubicación `archivo:línea` y recomendación.

## Informes

| # | Persona | Estado |
|---|---------|--------|
| 01 | [Líder sin suscripción](01-lider-sin-suscripcion.md) | ✅ |
| 02 | [Líder con plan activo](02-lider-con-plan.md) | ✅ |
| 03 | [Advisor / Mentor](03-advisor-mentor.md) | ✅ |
| 04 | [Gestor](04-gestor.md) | ✅ |
| 05 | [Administrador](05-admin.md) | ✅ |
| 06 | [Invitado](06-invitado.md) | ✅ |
| 99 | [Backlog consolidado priorizado](99-backlog-consolidado.md) | ✅ |

## Método
- **Gating dual:** permiso de **rol** (`app_auth.role_module_permissions` → `can(moduleCode, action)`) + features del **plan** (`getViewerAccessState` → banderas `canAccess*`).
- **Severidades:** 🔴 P1 (alto impacto en experiencia/conversión) · 🟠 P2 (consistencia/fricción) · 🟡 P3 (mejora/oportunidad).

## Convenciones
- Cada hallazgo: `[área UX/UI/Copy | ubicación archivo:línea | problema | impacto | recomendación]`.
- Al final, un backlog consolidado transversal a todos los roles para priorizar implementación.
