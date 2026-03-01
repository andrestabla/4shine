# 4Shine Database

## Migration
- File: `db/migrations/20260301_initial_platform_schema.sql`
- Status: applied to Neon (idempotent)
- Includes: RBAC, RLS, modular schemas, and `app_learning.content_assignments` for training tracking

## Seed
- File: `scripts/seed-db.mjs`
- Seeds real initial dataset for 4Shine:
  - users/profiles/roles
  - cohort + memberships
  - mentorships + assignments + feedback
  - learning/methodology/training content
  - networking, jobs, chats, workshops
  - notifications, quotes, and news

## Schemas
- `app_auth`: roles, modules, permission matrix, helper functions, credentials, refresh sessions
- `app_core`: users, profiles, cohorts, trajectory, notifications
- `app_assessment`: tests and pillar scores
- `app_learning`: learning/methodology content, tags, comments, progress, reviews
- `app_mentoring`: mentors, assignments, sessions, participants, feedback
- `app_networking`: connections, jobs, groups, chats, messages, workshops
- `app_admin`: audit logs

## RBAC
- Roles: `lider`, `mentor`, `gestor`, `admin`
- Modules: 16 modules seeded from app navigation
- Matrix table: `app_auth.role_module_permissions`
- View: `app_auth.v_role_permission_matrix`
- Permission function: `app_auth.has_permission(module_code, action)`

## RLS Runtime Context
RLS policies use two Postgres runtime settings:

```sql
SELECT set_config('app.current_user_id', '<uuid>', true);
SELECT set_config('app.current_role', 'lider', true);
```

After setting context, queries are filtered by policy rules.

## Authentication Objects
- `app_auth.user_credentials`: password hash, lock state, failed attempts
- `app_auth.refresh_sessions`: persisted refresh-token sessions (rotation/revocation)

## Optional DB Runtime Roles
Created non-login roles:
- `app_lider`
- `app_mentor`
- `app_gestor`
- `app_admin`

Use your API role with `SET ROLE` if you want DB-level grant separation in addition to RLS.
