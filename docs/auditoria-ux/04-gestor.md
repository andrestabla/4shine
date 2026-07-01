# Auditoría UX/UI 360 — Persona: Gestor

> Rol `gestor`: orquesta la operación del programa (no es admin de plataforma). Gating por permiso de rol (`role_module_permissions`, `db/migrations/20260301_initial_platform_schema.sql:338‑354`).

## 1. Persona
Gestiona el día a día: **convocatorias** (revisar/aprobar/publicar), **contenido** (crear/aprobar), **líderes** (progreso), **mentorías/workshops** (moderar), **analítica**, y **usuarios** (ver/crear/editar, **sin eliminar**). No accede a configuración de plataforma (branding, planes, integraciones, notificaciones, site) → requieren `usuarios:manage`, que el gestor **no** tiene.

## 2. Matriz de acceso (resumen)
| Módulo | view | manage | Nota |
|---|:--:|:--:|---|
| convocatorias | ✓ | ✓ | aprueba/publica solicitudes |
| contenido | ✓ | ✓ | crea + aprueba |
| lideres | ✓ | ✓ | progreso 360 |
| mentorias / workshops | ✓ | ✓ | modera/gestiona |
| networking | ✓ | ✓ (moderate) | |
| analitica | ✓ | ✓ | exporta XLSX/PDF |
| usuarios | ✓ | ✗ (create/update, **no delete/manage**) | |
| branding/planes/integraciones/site/notificaciones | ✗ | ✗ | admin-only |

## 3. Hallazgos priorizados

### 🔴 P1 — Altos
- **H1 · `/dashboard/administracion` se renderiza sin guardia de cliente** (`administracion/page.tsx:76‑109`): el gestor puede navegar por URL y **ve el grid completo** de opciones admin (títulos/descripciones), aunque el backend luego bloquee las subrutas. Confunde y expone la superficie admin. → guard en cliente (`can('usuarios','manage')`) con redirect/403.
- **H2 · Usuarios: accesible pero oculto del menú** (`Sidebar.tsx`): el gestor tiene `usuarios:view/create/update` pero **no hay ítem** de Usuarios en el sidebar (es `adminOnly`) → función escondida (solo por URL). → decidir: exponerlo en el menú **o** retirar el permiso. Inconsistencia menú↔permiso.
- **H3 · Convocatorias: "Rechazar" sin confirmación clara** (`convocatorias/page.tsx`): aprobar muestra aviso de éxito, pero **rechazar recarga en silencio** (sin toast). → toast de éxito/error simétrico + spinner. *(La ruta de aprobar/publicar ya se corrigió en una iteración previa; falta el feedback de rechazo.)*

### 🟠 P2 — Medios
- **H4 · Usuarios: puede crear pero no eliminar** (`20260320_...permissions.sql:14‑23`): flujo incompleto ("creé por error, ¿cómo deshago?") sin explicación en UI. → dar `delete` o explicar la limitación.
- **H5 · Dashboard: el atajo "Administración" está oculto** pero el gestor gestiona varias cosas que sí puede (contenido, convocatorias); no hay un punto claro de "configuración avanzada" acorde a su rol.
- **H6 · Contenido: los *scopes* no mapean claro a permisos** (`contenido/page.tsx:47`): "Formación Líderes" vs módulo real → riesgo de crear en el scope equivocado.

### 🟡 P3 — Mejoras
- Analítica: exportaciones sin spinner/estado de error.
- Dashboard: panel derecho ("Próximas sesiones") queda vacío para gestor sin explicación → widget alternativo (moderación/pendientes).
- Convocatorias: "Mis solicitudes" se oculta si está vacío (poca discoverability para el líder).

## 4. Fortalezas
- **Modelo de permisos granular y correcto** (view/create/update/delete/approve/moderate/manage) con short-circuit para admin.
- **Separación de roles clara**: gestor = operación; admin = plataforma.
- Flujos de aprobación bien implementados (convocatorias, contenido, workshops); sidebar contextual.

## 5. Veredicto
Rol bien pensado para operación, con permisos correctos en BD. El problema es de **coherencia entre lo que el menú/páginas muestran y lo que el gestor puede realmente hacer** (H1, H2) y de **feedback de acciones** (H3). Prioridad: **H1 y H2** (seguridad percibida + discoverability).
