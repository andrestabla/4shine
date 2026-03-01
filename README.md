# 4Shine Platform

Plataforma de liderazgo 4Shine desarrollada con Next.js y PostgreSQL (Neon), diseñada con arquitectura de aplicación desde el inicio:
- capa de datos relacional por módulos
- RBAC por rol y módulo
- políticas RLS para control de acceso por fila
- API backend en `app/api/v1/*`
- frontend desacoplado de mocks (hidratación desde backend al login)

## Arquitectura (App Scope)

- Frontend: Next.js App Router + React (cliente)
- Backend: Route Handlers (`src/app/api/v1/*`) + servicios en `src/server/*`
- DB: PostgreSQL modular (`app_auth`, `app_core`, `app_assessment`, `app_learning`, `app_mentoring`, `app_networking`, `app_admin`)
- Seguridad: matriz de permisos por rol (`lider`, `mentor`, `gestor`, `admin`) + RLS
- Auth: JWT access/refresh + sesión persistida en DB (`app_auth.refresh_sessions`)

## Base de Datos

- Migración principal: `db/migrations/20260301_initial_platform_schema.sql`
- Seeder inicial: `scripts/seed-db.mjs`
- Comandos:

```bash
npm run db:migrate
npm run db:seed
```

Variables de entorno:

```bash
cp .env.example .env.local
# set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

## API principal

- Auth:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Bootstrap:
  - `GET /api/v1/bootstrap/me` (principal, basado en JWT/cookies)
  - `GET /api/v1/bootstrap/:role` (protegido, uso administrativo/compatibilidad)

## Dashboard modular

Rutas ya desacopladas por módulo:

- `/dashboard`
- `/dashboard/trayectoria`
- `/dashboard/aprendizaje`
- `/dashboard/metodologia`
- `/dashboard/mentorias`
- `/dashboard/networking`
- `/dashboard/convocatorias`
- `/dashboard/mensajes`
- `/dashboard/workshops`
- `/dashboard/perfil`
- `/dashboard/lideres`
- `/dashboard/formacion-mentores`
- `/dashboard/gestion-formacion-mentores`
- `/dashboard/usuarios`
- `/dashboard/contenido`
- `/dashboard/analitica`

## Desarrollo

```bash
npm install
npm run dev
```

## Notas

- El frontend mantiene compatibilidad con componentes existentes, pero ahora los datos se cargan desde DB al iniciar sesión.
- `mockData` se usa como contrato de UI y fallback; el origen principal ya es backend real.
