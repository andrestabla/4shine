// Compatibilidad de API: /api/v1/public/site/advisers fue renombrado a
// /advisors al cambiar la nomenclatura de "Adviser" a "Advisor". Este
// handler existe para que clientes externos que aún apunten al endpoint
// viejo (widgets embebidos, integraciones, cachés CDN) sigan recibiendo
// la misma respuesta. Reexporta el GET del nuevo handler para no
// duplicar lógica. El `dynamic` se declara aquí como literal porque
// Next.js exige route-segment configs como valores estáticos en cada
// archivo (no acepta re-export).
export { GET } from '../advisors/route';
export const dynamic = 'force-dynamic';
