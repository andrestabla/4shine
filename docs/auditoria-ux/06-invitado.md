# Auditoría UX/UI 360 — Persona: Invitado

> Rol `invitado`: cuenta real con acceso **solo a Descubrimiento** (`db/migrations/20260415_invited_role_and_discovery_only_permissions.sql:32‑62`).

## 1. Persona y matiz importante
El invitado se **auto-promueve a `lider`** en el primer login (`promote-invitado.ts:14‑79`): cambia `primary_role` a `lider` y registra la compra `discovery_4shine`. Es decir, el estado "invitado puro" es **transitorio/inicial**; tras loguearse queda como líder open_leader con Descubrimiento habilitado. Aun así, el rol `invitado` existe y define la experiencia mínima.

## 2. Matriz de acceso
| Módulo | Estado |
|---|---|
| Dashboard (home), Descubrimiento, Perfil | ✅ |
| Todo lo demás (trayectoria, aprendizaje, mentorías, networking, convocatorias, mensajes, workshops, líderes, admin) | ❌ |

**Home** (`dashboard/page.tsx:95‑105`): "Vista Invitado · Acceso de descubrimiento" · CTA único "Ir a descubrimiento" · greeting "Tu primer paso es el diagnóstico…". Sidebar solo muestra Inicio, Descubrimiento, Perfil.

## 3. Hallazgos priorizados

### 🔴 P1
- **Fortaleza · Propósito claro y sin fricción**: home, greeting y sidebar comunican exactamente qué hacer (un solo camino). Mantener.

### 🟠 P2
- **H1 · Dead-end tras completar el diagnóstico**: al terminar no hay CTA de "siguiente paso" (activar plan / ver trayectoria). El usuario cumple su único objetivo y queda sin ruta. → panel de cierre "Tu diagnóstico está listo → siguiente paso: activar tu plan".
- **H2 · Stats muestran "Recursos: N" pero no son accesibles** (`page.tsx:178‑184`) → confunde ("¿puedo verlos o no?"). → cambiar a "Planes disponibles" o `learningCount=0` para invitado.
- **H3 · Banderas contradictorias** en bootstrap: `canAccessAprendizajeRecursosFree=false` vs `freeLearningOnly=true` (`bootstrap/me/route.ts:31‑32`) — decidir y unificar. (También revisar `viewerTier:'staff'` asignado al invitado, que parece un rótulo incorrecto.)

### 🟡 P3
- **H4 · Inconsistencia redirect vs. muro**: intentar entrar a una ruta bloqueada a veces **redirige en silencio** a `/dashboard` (`layout.tsx:166‑170`) y otras muestra `ModuleLockedScreen`. → unificar (preferible el muro con CTA, o al menos un toast al redirigir).
- **H5 · Notificaciones post-diagnóstico** para el invitado no verificadas (¿recordatorio / nudge a plan?). → auditar plantillas.

## 4. Fortalezas
- Restricción limpia en BD (solo descubrimiento) y sidebar sin ruido.
- Auto-promoción transparente a líder (sin fricción).
- Exención del popup de privacidad para el invitado (menos fricción inicial).

## 5. Veredicto
La experiencia de entrada es **excelente en claridad** (un objetivo, un CTA). El punto débil es el **después del diagnóstico**: se corta el embudo sin empujar a la conversión (H1) y hay **ruido/contradicciones en el estado** (H2, H3). Prioridad: **H1** (CTA de continuidad) — es el momento de mayor intención de compra.
