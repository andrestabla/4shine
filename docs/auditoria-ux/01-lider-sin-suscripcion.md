# Auditoría UX/UI 360 — Persona: Líder sin suscripción

> Simulación de navegación basada en el comportamiento real del código (mismo gating que corre en vivo). Citas a `archivo:línea`.

## 1. Persona y método
- **Quién es:** rol `lider` con `viewerTier = "open_leader"` → sin plan dinámico vigente (`subscription_plan_id IS NULL` o vencido) y sin plan legacy/compra de programa. `getViewerAccessState` deja todas las banderas `canAccess*` en `false` salvo excepciones (`src/features/access/service.ts:383‑450`).
- **Alcance:** 100% de rutas del dashboard.

## 2. Mapa de acceso

| Módulo | Estado | Mecanismo |
|---|---|---|
| Inicio (home) | ✅ parcial (promo + teasing) | render `isOpenLeader` (`dashboard/page.tsx:377‑510`) |
| Perfil | ✅ completo (editar) | permiso de rol |
| Descubrimiento | ✅ completo | recurso libre / compra puntual |
| Aprendizaje | ✅ solo "recursos libres"; Cursos y Workbooks bloqueados | `canAccessAprendizajeRecursosFree=true` siempre |
| Suscripción (`/dashboard/suscripcion`) | ✅ vía URL (no está en el menú) | sin gating |
| Mentorías | ⚠️ bloqueado salvo compra de pack puntual | `canAccessMentoring1on1` por créditos |
| Trayectoria, Networking, Convocatorias, Workshops, Mensajes | ❌ bloqueado por plan | `ModuleLockedScreen` |
| Líderes, Formación advisors, Admin/* | ❌ ni aparece (permiso de rol) | `role_module_permissions` |

## 3. Recorrido 360 (resumen)
`/dashboard` → promo "Tu liderazgo empieza aquí" + 3 accesos free + grilla de módulos bloqueados → CTA `/planes-precios`. **Accesibles:** descubrimiento (sin límites), aprendizaje (solo free), perfil, suscripción. **Bloqueados con `ModuleLockedScreen`:** trayectoria, networking, convocatorias, workshops, mensajes. **Bloqueados a nivel rol (invisibles):** líderes, formación advisors, administración.

## 4. Hallazgos priorizados

### 🔴 P1 — Altos

**H1 · Menú lateral con "dead-ends": muestra módulos que el líder no puede abrir, sin señal de bloqueo**
- El sidebar filtra solo por permiso de rol (`hasAccess = can(moduleCode, action)`), **no por plan** (`src/components/Sidebar.tsx:204‑208`). El líder ve Trayectoria, Networking, Mentorías, Convocatorias, Mensajes y Workshops como ítems normales; al hacer clic → pantalla bloqueada. No hay badge/🔒/opacidad.
- **Impacto:** expectativa rota repetida (clic → muro).
- **Recomendación:** mantenerlos visibles (FOMO) pero marcarlos con candado/badge "Plan"; opcionalmente abrir un *preview* en vez del muro.

**H2 · Ruta de conversión fragmentada: el CTA saca al usuario logueado al sitio público**
- Casi todos los CTA de upgrade van a `/planes-precios` (página **pública**, MarketingShell), mientras existe `/dashboard/suscripcion` (interna) que **no está enlazada en el menú**.
- **Impacto:** el líder logueado "sale" del dashboard a la web de marketing para convertir; doble destino = inconsistencia y posible fuga.
- **Recomendación:** una sola ruta de conversión, idealmente dentro del dashboard, enlazada desde el menú/header.

**H3 · Estados de bloqueo inconsistentes (dos patrones para lo mismo)**
- Trayectoria/Networking/Convocatorias/Workshops/Mensajes usan `ModuleLockedScreen` (rico). Aprendizaje (Cursos, Workbooks) usa empty-states custom (`aprendizaje/page.tsx:794‑828 y 1058‑1076` vs `ModuleLockedScreen.tsx`).
- **Recomendación:** unificar en un único componente (variante inline de `ModuleLockedScreen`).

### 🟠 P2 — Medios
- **H4 · Microcopy inconsistente:** "se desbloquean" vs "se desbloquea automáticamente"; CTA "Ver planes y precios" vs "Elegir este plan"; badge "Módulo bloqueado" (negativo). → Unificar voz/CTA.
- **H5 · CTA de upgrade sin contexto:** todos a `/planes-precios` sin indicar el módulo. → `?from=<módulo>` + resaltar el plan que lo desbloquea.
- **H6 · `footnote` tranquilizador solo en Trayectoria.** → añadir a todos los `ModuleLockedScreen`.
- **H7 · Redundancia de banners en Aprendizaje** (aviso "activa tu plan" 2x). → deduplicar.

### 🟡 P3 — Mejoras
- Preview de "5 fases / 10 workbooks" antes del CTA.
- Features cuantificadas ("conecta con líderes de tu industria + matching").
- CTA sticky en móvil.
- Recomendar 3 recursos free tras "Explorar recursos".

## 5. Quick wins
1. Badge/candado en ítems bloqueados del sidebar (H1).
2. Unificar microcopy y texto del CTA (H4).
3. `footnote` en todos los `ModuleLockedScreen` (H6).
4. Deduplicar banner de Aprendizaje (H7).

## 6. Fortalezas (mantener)
- Home con promo + 3 accesos free + teasing claro.
- Perfil y Descubrimiento sin fricción.
- Destino de CTA consistente y copy orientado a valor.

## 7. Veredicto
Sólido y coherente en intención. A corregir: consistencia de sistema (H1, H3, H4) y arquitectura de conversión (H2). Prioridad de negocio: **H2 y H1** (impactan la tasa de upgrade).
