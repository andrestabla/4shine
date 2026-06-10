// Ruta espejo del detalle de aprendizaje para el scope `formacion_mentores`.
//
// El componente del detalle vive en /dashboard/aprendizaje/recursos/[contentId]
// y ya es scope-aware: detecta el scope desde el record y construye backHref,
// editHref y enlaces a "cursos" hacia /dashboard/formacion-mentores cuando
// corresponde. Reusarlo aquí evita duplicar ~2300 líneas de UI (módulos
// internos, comentarios, likes, progreso, certificados, SCORM/video player,
// etc.) y mantiene un único punto de mantenimiento.
//
// Sirve la misma experiencia exacta bajo la URL pública
// /dashboard/formacion-mentores/[contentId].
export { default } from '@/app/dashboard/aprendizaje/recursos/[contentId]/page';
