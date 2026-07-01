# Auditoría UX/UI 360 — Persona: Administrador

> Rol `admin`: acceso total. Ve `MAIN_NAV_ITEMS` + `ADMIN_NAV_ITEMS` y todo `/dashboard/administracion/*`.

## 1. Persona
Control central de la operación. Gestiona usuarios, planes/pagos, branding, integraciones, site builder, notificaciones, asistente IA, tour, políticas y documentación. Home: "Vista Administrador · Control central de operación" (`dashboard/page.tsx:59‑69`) con stats [Usuarios activos, Cohortes, Integridad, Novedades].

## 2. Inventario de secciones admin (todas funcionales)
- **Hub** `/dashboard/administracion` (11 tarjetas de acceso) · `administracion/page.tsx`
- **Usuarios** `/dashboard/usuarios` (tabs: Usuarios, Sesiones, Bajas, Roles) + `/nuevo` + `/[userId]`
- **Planes** `/administracion/planes` (planes + productos puntuales) + `/nuevo` + `/[id]` · **Pagos** `/administracion/pagos`
- **Branding** `/administracion/branding` (5 tabs: Identidad, Tema, Login, Preview, Historial con reversión)
- **Integraciones** `/administracion/integraciones` (9+ integraciones con asistente guiado + correo saliente)
- **Site** `/administracion/site` (+ `/[pageId]` builder)
- **Notificaciones** `/administracion/notificaciones` (Plantillas, Eventos, Enviar, Historial, Popups, Recordatorios)
- **Asistente IA** `/administracion/asistente-ia` (Config, Sitio público/Tatiana, FAQs, Conversaciones, Analítica)
- **Tour** `/administracion/tour` · **Políticas** `/administracion/politicas` · **Documentación** `/administracion/documentacion`
- **Contenido** `/dashboard/contenido` · **Analítica** `/dashboard/analitica` (compartidos con gestor)

## 3. Hallazgos priorizados

### 🔴 P1 — Altos
- **H1 · Orientación: no hay breadcrumbs ni jerarquía en el admin.** El Hub tiene 11 tarjetas y muchas secciones anidan (p. ej. Notificaciones → Plantillas → Nueva) sin migas de pan ni submenú. El admin "se pierde" y duplica clics volviendo al Hub. → breadcrumbs consistentes + submenú expandible en el sidebar para las secciones admin (`Sidebar.tsx:141‑189`, `administracion/page.tsx`).
- **H2 · Acciones masivas de usuarios sin revisión previa.** Seleccionar N usuarios → "Ampliar suscripción / cerrar sesiones / forzar contraseña" se ejecuta con `confirm()` básico, sin modal de *review* de a quién afecta (`usuarios/page.tsx`). Riesgo de operación errónea a escala. → modal de revisión (lista de afectados + parámetros + "Ejecutar") y/o modo *dry-run*.
- **H3 · Formularios muy densos → fatiga.** La pestaña "Login" de Branding y la de Usuarios acumulan decenas de campos con scroll infinito y poco sentido de progreso (`branding/page.tsx`, `usuarios/page.tsx`). → dividir la pestaña "Login" (Textos/Layout vs Imágenes/Avanzado) o usar wizard con indicador de paso.

### 🟠 P2 — Medios
- **H4 · Asistentes de integración sin contador de paso ni responsive** (modal ~80% ancho, difícil en móvil) — `integraciones/page.tsx`. → "Paso X de Y" + layout responsive.
- **H5 · Inputs de color sin validación de hex inline** (feedback solo al guardar) — `branding/page.tsx`. → validar `^#[0-9A-F]{6}$` en `onChange` + autocompletar `#`.
- **H6 · Listado de Site sin búsqueda/paginación** (no escala con muchas páginas) — `site/page.tsx`.
- **H7 · Editor del Tour sin preview en vivo** (redactar HTML → guardar → disparar tour para ver) — `tour/page.tsx`. → split-screen preview.
- **H8 · Toggle "Habilitar integración" no sincroniza el badge de estado** al instante (parece roto) — `integraciones/page.tsx:1337‑1365`.
- **H9 · Notificaciones sin vista de dependencias** (qué plantilla usa qué evento) ni búsqueda cruzada — `notificaciones/page.tsx`.

### 🟡 P3 — Mejoras
- Hub admin: agrupar las 11 tarjetas por categoría (Operación / Integraciones / Monetización / Comunicaciones / Features) — `administracion/page.tsx:76‑108`.
- Historial de branding: fila expandible con todos los campos cambiados (hoy trunca "+X más").
- Planes: chip "Módulos X/Y" no expandible; mostrar qué módulos incluye al hover/click.
- Filtros de Usuarios sin "Limpiar filtros"; save bar de branding no responsive en móvil.

## 4. Deuda técnica (mantenibilidad, no UX)
Archivos monolíticos muy grandes: `integraciones/page.tsx` (~1.4k líneas) y `branding/page.tsx` (~1.36k). No afecta directamente al usuario, pero encarece el mantenimiento y el riesgo de regresiones. → extraer asistentes/tabs a componentes.

## 5. Fortalezas
- **Asistentes guiados** por integración con `helpText` y validación pre-guardado.
- **Versionado + reversión** en Branding (histórico con "Restaurar").
- Patrón de **tabs** consistente (Branding, Asistente IA, Tour).
- **Hub central** claro; acciones masivas de usuarios; uploads R2; badges de estado; editores rich-text.

## 6. Veredicto
Cobertura funcional **muy completa** (posiblemente la mejor construida de la plataforma). Los problemas son de **escala y orientación** (H1 breadcrumbs/jerarquía) y de **seguridad operativa** (H2 revisión de acciones masivas), no de funcionalidad. Prioridad: **H1 y H2**.
