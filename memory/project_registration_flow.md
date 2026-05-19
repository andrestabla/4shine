---
name: Auth Registration Flow
description: Self-registration flow added to /acceso — manual + Google, needs GOOGLE_CLIENT_ID env vars
type: project
---

Self-registration was added to /acceso (2026-05-07). Users register as role=lider, plan=null (free).

**New files:**
- `src/features/usuarios/service.ts` — added `selfRegisterUser()` (bypasses requireModulePermission)
- `src/app/api/v1/auth/register/route.ts` — public POST endpoint; creates user + sets auth cookies
- `src/app/api/v1/auth/google/route.ts` — verifies Google ID token via tokeninfo endpoint; returns action=login or action=register
- `src/app/acceso/RegisterForm.tsx` — 2-step form component (name/email/password → profession/industry/country/jobRole)
- `src/app/acceso/page.tsx` — updated with register mode toggle and Google button

**Modified:**
- `UserContext.tsx` — exported `SessionUser` interface, added `applySession` to context type and value

**Why:** Both `applySession` and navigation must happen after registration to initialize the session without a hard reload.

**How to apply:** To enable Google Sign-In, set these env vars:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — for client-side Google button rendering
- `GOOGLE_CLIENT_ID` — for server-side token verification
Google button only renders when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set; the rest of the form works without it.
