# Auditoría UX/UI 360 — Persona: Líder con plan activo

> Rol `lider` con `viewerTier='subscriber'` (plan dinámico vigente). Gating dual: **rol** (qué módulos ve) + **features del plan** (cuáles desbloquea) — `getViewerAccessState` (`src/features/access/service.ts:424‑453`).

## 1. Persona
Líder con suscripción activa. Home: "Líder con suscripción · Tu ruta estratégica ya está activa" con stats [Progreso %, Diagnóstico %, Conexiones, Mentorías] y "Continúa donde quedaste" (`dashboard/page.tsx:122‑129, 291‑302`). **Clave:** aún con plan, algunos módulos pueden seguir bloqueados si su plan específico **no incluye esa feature**.

## 2. Matriz de acceso
| Módulo | Acceso | Depende de |
|---|---|---|
| Inicio, Perfil, Descubrimiento | ✅ | rol / feature descubrimiento |
| Aprendizaje | ✅ recursos free siempre; Cursos/Workbooks según feature | `aprendizaje_cursos`, `aprendizaje_workbooks` |
| Trayectoria | ✅/❌ (todo o nada) | feature `trayectoria` |
| Mentorías 1:1 y grupales | ✅/❌ por feature (+ créditos comprados) | `mentorias_1on1`, `mentorias_grupales` |
| Networking, Convocatorias, Mensajes, Workshops | ✅/❌ por feature | features homónimas |
| Líderes, Formación advisors, Admin | ❌ (rol) | no aplica a `lider` |

**Punto crítico:** un plan puede incluir p. ej. Trayectoria + Aprendizaje pero **no** Networking → ese módulo muestra `ModuleLockedScreen` aunque el usuario "ya pagó".

## 3. Hallazgos priorizados

### 🔴 P1 — Altos
- **H1 · `ModuleLockedScreen` no refleja el plan real del usuario** (`components/access/ModuleLockedScreen.tsx`): las features listadas son estáticas y el CTA es genérico ("Ver planes"). Un líder que ya tiene plan y llega a un módulo no incluido no entiende **qué le falta** ni **qué plan** lo desbloquea. → pasar `missingFeatures`/plan objetivo y personalizar.
- **H2 · Cadencia de 10 días (mentorías 1:1 incluidas) mal comunicada** (`mentorias/page.tsx`): la siguiente sesión se habilita 10 días después del inicio de la anterior, pero la UI solo muestra "Bloqueada"; el líder confunde "en cadencia" con "consumida". → banner + **fecha exacta de desbloqueo** por entitlement.
- **H3 · Estados vacíos pobres** (`components/dashboard/EmptyState.tsx` = `<p>{message}</p>`): en Aprendizaje/Convocatorias/Workshops sin datos publicados el usuario ve un panel gris sin ícono ni CTA → dead-end. → ícono + copy humano + acción sugerida.
- **H4 · Sidebar no marca los módulos fuera del plan** (igual que en open_leader): el líder ve los 9 módulos y descubre el bloqueo solo al hacer clic → "paywall sorpresa". → badge/🔒 en módulos no incluidos.

### 🟠 P2 — Medios
- **H5 · Home no muestra el plan ni su vencimiento** (`dashboard/page.tsx:120‑129`): "Tu ruta ya está activa" no dice qué plan ni hasta cuándo. → "Plan X · vigente hasta DD/MM" con link a `/dashboard/suscripcion`.
- **H6 · Networking: la pestaña "Mensajes" es un redirect** (`networking/page.tsx:1097‑1116`) → parece que no carga. → quitar la pestaña y dejar un CTA "Enviar mensaje".
- **H7 · Aprendizaje: pestaña "Certificados" es admin-only** y su ausencia no se explica al líder; si completa un curso no ve "Mis certificados". → mostrar certificados ganados al líder.
- **H8 · Next Steps sin fallback**: si `summary` falla, la sección desaparece sin aviso. → fallback basado en `viewerAccess`.

### 🟡 P3 — Mejoras
- Convocatorias/Workshops sin paginación/"cargar más".
- Diagnóstico en stats muestra "0%" en vez de "No iniciado".
- Rotación de frase del día sin timezone del usuario.
- Tipos de convocatoria/workshop sin ícono+color diferenciado.

## 4. Fortalezas
- **Gating dual robusto** y declarativo (`features-catalog.ts`), con fallbacks legacy y compras sticky.
- `ModuleLockedScreen` consistente; divergencia de home open_leader/subscriber clara; CTAs primarias inequívocas.
- Awareness de timezone en widgets de fecha.

## 5. Veredicto
Experiencia de suscriptor sólida. El mayor riesgo es la **desconexión entre "tengo plan" y "sigo viendo bloqueos"** (H1, H4) y la **cadencia de mentorías** poco explicada (H2) — ambos generan tickets de soporte y percepción de "pagué y no puedo". Prioridad: **H1, H2, H4**.
