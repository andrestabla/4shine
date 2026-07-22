# Revertir `BYPASSRLS` en `app_runtime`

Estado: **pendiente**. Análisis hecho el 22/07/2026 sobre producción; no se ha
cambiado nada.

## Qué pasa hoy

```
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname='app_runtime';
--  app_runtime | true
```

La migración `20260514_app_runtime_bypassrls.sql` otorgó `BYPASSRLS` al rol con
el que corre la aplicación. Consecuencia: **las 43 tablas con RLS —incluidas las
marcadas `FORCE ROW LEVEL SECURITY`— no evalúan ninguna política**. El control de
acceso vive por completo en TypeScript (`requireModulePermission`), sin red de
seguridad en la base de datos.

No es explotable por sí solo, pero convierte cualquier consulta de servicio que
olvide filtrar por propietario en un IDOR real, en vez de un error bloqueado por
Postgres. La auditoría encontró un caso así: `updateMentorship` permitía a
cualquier líder modificar mentorías ajenas, y la política `mentorship_mentor_update`
que lo habría impedido existe — simplemente no se evalúa.

## Lo que se comprobó

**Las políticas están mejor de lo que sugería el comentario de la migración.**
El motivo declarado fue que las políticas `INSERT ... WITH CHECK (true)` fallaban
con `FORCE ROW SECURITY` a través del pooler de Neon. Hoy:

- 43 tablas con RLS activa.
- **0 políticas de escritura sin `WITH CHECK`**.
- **1 sola tabla** con RLS y sin ninguna política de escritura, que quedaría
  bloqueada: `app_mentoring.program_mentorship_templates`.

**Las funciones auxiliares funcionan correctamente** bajo `withRoleContext`:

| Contexto | `current_user_id()` | `is_admin()` | `has_permission('usuarios','manage')` |
|---|---|---|---|
| admin | uuid | `true` | `true` |
| líder | uuid | `false` | `false` |
| **sin contexto** | `null` | `null` | **`false`** |

Esa última fila es la clave: **sin contexto de rol, toda política deniega**.

## El obstáculo real

18 archivos abren conexión sin `withRoleContext` y tocan tablas con RLS. La
mayoría se arreglan envolviéndolos, pero **cuatro no pueden tener contexto de
usuario porque corren antes de que exista la sesión**:

| Archivo | Tabla | Por qué no puede tener contexto |
|---|---|---|
| `src/server/auth/request-auth.ts` | `app_core.users` | Lee el rol en **cada petición autenticada**; es lo que *produce* el contexto |
| `src/app/api/v1/auth/login/route.ts` | `app_core.users` | Valida credenciales antes de que haya sesión |
| `src/app/api/v1/auth/register/route.ts` | `app_core.users` | Crea al usuario que aún no existe |
| `src/app/api/v1/auth/google/route.ts` | `app_core.users` | Igual, vía SSO |

Quitar `BYPASSRLS` sin resolver esto **rompe el inicio de sesión y, con él, toda
la plataforma**: `request-auth.ts` corre en cada petición.

Otros afectados, ya sin ese problema conceptual: `usuarios/service.ts`,
`notificaciones/bulk-service.ts`, `lib/site-settings.ts`, `lib/site-pages.ts`,
`public/sso-config`, `public/privacy-policy`, `public/site-settings`,
`integrations/zoom/webhook`, `administracion/politicas`,
`mentorias/group-sessions/[eventId]/ics`, `cron/descubrimiento/drain-ai-jobs`,
`auth/verify-email`, `auth/resend-verification`, `auth/accept-policy`.

## Plan propuesto

1. **Políticas de pre-autenticación.** Añadir a `app_core.users` (y a
   `user_policy_acceptances`) una política que permita la operación cuando NO hay
   contexto de usuario, acotada a lo mínimo: lectura por `user_id`/`email` e
   inserción del propio registro. Alternativa más limpia pero más costosa: un
   segundo rol de BD (`app_auth_runtime`) con privilegios solo sobre esas tablas,
   usado exclusivamente por los flujos de autenticación.
2. **Envolver el resto** en `withRoleContext`, o darles una política de servicio
   equivalente. Son 14 archivos, mecánico.
3. **Política de escritura** para `app_mentoring.program_mentorship_templates`.
4. **Probar en un entorno con `CREATEROLE`**: crear un rol clon sin `BYPASSRLS`,
   ejecutar el conjunto de escrituras representativas y confirmar que ninguna
   falla. *(No fue posible desde producción: el usuario de conexión no tiene
   `CREATEROLE`.)*
5. **Revertir** con `ALTER ROLE app_runtime NOBYPASSRLS;` y vigilar los errores
   las primeras horas, con el `ALTER` inverso listo como marcha atrás.

## Además: 100 tablas nunca tuvieron RLS

Aparte de este trabajo, 100 de las 132 tablas creadas en las migraciones nunca
recibieron `ENABLE ROW LEVEL SECURITY`. Entre ellas `app_auth.user_credentials`,
`app_auth.refresh_sessions`, `app_billing.user_purchases` y
`app_assessment.discovery_sessions`. Tiene sentido abordarlo después de revertir
el bypass — antes no aportaría nada, porque el rol lo saltaría igual.
