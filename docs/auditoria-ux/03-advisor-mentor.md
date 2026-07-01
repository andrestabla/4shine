# Auditoría UX/UI 360 — Persona: Advisor / Mentor

> Rol `mentor`: acompaña a los líderes. Gating por permiso de rol (`role_module_permissions`).

## 1. Persona
Advisor/mentor con permisos ampliados vs. líder: **ve el panel de Líderes (360)**, **Formación de advisors**, gestiona su **agenda de mentorías** (1:1 y grupales como anfitrión) y edita su **perfil público de advisor** (temas, precio, competencias). No accede a administración, usuarios, contenido ni analítica.

## 2. Matriz de acceso (permisos de rol `mentor`)

| Módulo | view | create | update | delete | Notas |
|---|:--:|:--:|:--:|:--:|---|
| dashboard | ✓ | | | | home "Vista Advisor" |
| trayectoria | ✓ | | ✓ | | avance personal |
| aprendizaje | ✓ | ✓ | ✓ | | puede crear/editar contenido |
| mentorias | ✓ | ✓ | ✓ | | **agenda + sesiones (anfitrión)** |
| networking | ✓ | ✓ | ✓ | | |
| convocatorias | ✓ | | | | solo lectura |
| mensajes | ✓ | ✓ | ✓ | ✓ | chat completo con sus líderes |
| workshops | ✓ | ✓ | ✓ | | |
| perfil | ✓ | | ✓ | | **perfil público de advisor** |
| lideres | ✓ | | ✓ | | **vista 360 de líderes** |
| formacion_mentores | ✓ | ✓ | ✓ | | cursos para advisors |
| usuarios/contenido/analitica/administración | ✗ | | | | sin acceso |

Fuente: `db/migrations/20260301_initial_platform_schema.sql`, `src/components/Sidebar.tsx`.

## 3. Recorrido 360 (clave)
- **Home** (`dashboard/page.tsx:84‑92`): "Vista Advisor · Acompañamiento experto con contexto" · CTA "Ver agenda" + "Abrir mensajes" · stats [Líderes, Sesiones, Horas, Rating].
- **Líderes** (`lideres/page.tsx`): búsqueda multiparámetro + 5 filtros + vista tarjeta/lista + "Ver 360".
- **360 del líder** (`lideres/[userId]/page.tsx`): 9 secciones (workbooks, diagnóstico, mentorías, contenido, networking, convocatorias, workshops) + modal "Agendar 1:1".
- **Mentorías** (`mentorias/page.tsx`): grupales (agenda semanal), programa (wizard), comprar (catálogo + smart search IA).
- **Mensajes**: chat real-time (edit/delete, embeds YouTube).
- **Formación advisors** (`formacion-mentores/page.tsx`): crear/editar cursos.
- **Perfil**: bloque exclusivo "Perfil de Advisor" (experiencia, precio COP validado, temas con competencia 4Shine) + extracción desde CV.

## 4. Hallazgos priorizados

### 🔴 P1
- **H1 · Dead-end al agendar 1:1 sin franjas** (`lideres/[userId]/page.tsx:799‑811`): si el advisor no publicó disponibilidad, el CTA desaparece con mensaje genérico y **sin alternativa** (contactar/solicitar). → añadir "Contactar al advisor" (abre `/mensajes`) o "Solicitar disponibilidad".
- **H2 · Stats "0" ambiguos en home** (`dashboard/page.tsx:169‑175`): mentor nuevo ve Rating/Horas = `0` (¿malo o sin datos?). → mostrar "—/Sin datos" + hint "se actualiza tras tus primeras sesiones".
- **H3 · Cuota de mentorías incluidas agotada** (`mentorias/page.tsx:493‑526`): el modal muestra "Incluida" deshabilitada con copy confuso. → si no hay cupo, ocultar "Incluida" y enfocar "Adicional".

### 🟠 P2
- **H4 · Smart Search sin salida** (`mentorias/page.tsx:870‑890`): tras búsqueda IA no hay botón visible para volver al catálogo completo. → chip "Búsqueda activa ✕" / "Mostrar todos".
- **H5 · Extracción de CV sin preview** (`perfil/page.tsx:608‑700`): aplica cambios directo al form sin revisión. → modal de preview con campos editables/aceptables por campo.
- **H6 · Formación advisors sin métricas** (`formacion-mentores/page.tsx`): el autor no ve completions/feedback de su curso. → stats por curso (completados, pendientes, rating).
- **H7 · Confirmación de Zoom ausente** al crear sesión grupal con auto-Zoom (`mentorias/page.tsx:992‑1047`): no se muestra la URL creada. → toast con enlace + copiar.

### 🟡 P3
- "Próxima sesión" en tarjeta de líder sin hora ni advisor (`lideres/page.tsx:289‑291`).
- Tablas del 360 sin indicador de scroll horizontal en móvil (`lideres/[userId]/page.tsx:306‑349`).
- Mensajes sin autosave de borrador (`mensajes/page.tsx:990‑1012`).
- Sesiones grupales sin "no me interesa" (ruido en agenda).

## 5. Fortalezas
- **Vista 360 profunda** con deep-links y modal de agendamiento integrado.
- **Perfil de advisor extensible** (temas ↔ competencias 4Shine, precio validado, CV con IA).
- Búsqueda avanzada de líderes (multiparámetro, normaliza acentos, resalta matches).
- Mensajería real-time robusta; módulo de mentorías unificado (comprar+agendar+gestionar).

## 6. Veredicto
Rol bien estructurado y potente. Foco de mejora: **dead-ends cuando falta un recurso** (H1, H3) y **feedback del sistema** (H2 stats, H7 Zoom). Ninguno bloqueante; H1 y H2 son los de mayor impacto en la experiencia diaria del advisor.
