import type { ModuleCode } from '@/lib/permissions';
import { formatDateTime } from '@/lib/format-date';
import type { DashboardSummary } from './types';

export interface NextStep {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: 'compass' | 'map' | 'video' | 'users' | 'book' | 'shield' | 'settings' | 'sparkles';
}

type Can = (moduleCode: ModuleCode, action?: 'view' | 'manage') => boolean;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDateTime(iso);
}

/**
 * Pasos sugeridos según el estado real de cada módulo y el rol. Para usuarios
 * nuevos arroja naturalmente los "primeros pasos"; para recurrentes, "continúa".
 */
export function buildNextSteps(summary: DashboardSummary, role: string | null, can: Can): NextStep[] {
  const steps: NextStep[] = [];

  // ── Líder: ruta de transformación ──────────────────────────────────────────
  if (role === 'lider') {
    if (!summary.discovery.done && can('descubrimiento')) {
      steps.push({
        key: 'discovery',
        title: summary.discovery.completionPercent > 0 ? 'Termina tu diagnóstico' : 'Completa tu diagnóstico',
        description: 'Conoce tu perfil de liderazgo en Descubrimiento; es el punto de partida de tu ruta.',
        href: '/dashboard/descubrimiento',
        icon: 'compass',
      });
    }
    if (summary.routePercent < 100 && can('trayectoria')) {
      steps.push({
        key: 'trayectoria',
        title: summary.routePercent === 0 ? 'Inicia tu trayectoria' : `Continúa tu trayectoria (${summary.routePercent}%)`,
        description: 'Avanza al siguiente hito de tu ruta de 24 semanas.',
        href: '/dashboard/trayectoria',
        icon: 'map',
      });
    }
    if (can('mentorias')) {
      if (summary.mentorias.scheduled > 0) {
        const when = formatDate(summary.mentorias.nextSessionAt);
        steps.push({
          key: 'mentoria-prep',
          title: 'Prepara tu próxima mentoría',
          description: when ? `Tu próxima sesión es el ${when}. Llega con preguntas y aprendizajes.` : 'Tienes una sesión agendada. Prepárate para aprovecharla.',
          href: '/dashboard/mentorias',
          icon: 'video',
        });
      } else {
        steps.push({
          key: 'mentoria-agenda',
          title: 'Agenda una mentoría',
          description: 'Reserva una sesión 1:1 con tu advisor para acelerar tu avance.',
          href: '/dashboard/mentorias',
          icon: 'video',
        });
      }
    }
    if (can('networking')) {
      if (summary.networking.pending > 0) {
        steps.push({
          key: 'networking-pending',
          title: `Responde ${summary.networking.pending} solicitud(es) de contacto`,
          description: 'Tienes invitaciones pendientes en tu red.',
          href: '/dashboard/networking',
          icon: 'users',
        });
      } else if (summary.networking.connected === 0) {
        steps.push({
          key: 'networking-first',
          title: 'Haz tu primera conexión',
          description: 'Conecta con otros líderes y amplía tu red en Networking.',
          href: '/dashboard/networking',
          icon: 'users',
        });
      }
    }
    if (can('aprendizaje') && (summary.learning.workbooksCompleted < summary.learning.workbooksTotal || summary.learning.coursesAvgPercent < 100)) {
      steps.push({
        key: 'aprendizaje',
        title: 'Avanza en tu aprendizaje',
        description: 'Continúa tus cursos y workbooks pendientes.',
        href: '/dashboard/aprendizaje',
        icon: 'book',
      });
    }
  } else if (role === 'mentor') {
    if (can('lideres')) steps.push({ key: 'lideres', title: 'Revisa a tus líderes', description: 'Mira el avance de los líderes que acompañas.', href: '/dashboard/lideres', icon: 'users' });
    if (can('mentorias')) steps.push({ key: 'mentorias', title: 'Gestiona tus mentorías', description: 'Revisa tu agenda y disponibilidad de sesiones.', href: '/dashboard/mentorias', icon: 'video' });
    if (can('formacion_mentores')) steps.push({ key: 'formacion', title: 'Continúa tu formación de advisor', description: 'Avanza en los módulos de certificación.', href: '/dashboard/formacion-mentores', icon: 'book' });
  } else if (role === 'gestor' || role === 'admin') {
    if (can('usuarios', 'manage')) steps.push({ key: 'admin', title: 'Panel de administración', description: 'Gestiona usuarios, contenidos y configuración del programa.', href: '/dashboard/administracion', icon: 'shield' });
    if (can('lideres')) steps.push({ key: 'lideres', title: 'Seguimiento de líderes', description: 'Revisa el progreso de los líderes del programa.', href: '/dashboard/lideres', icon: 'users' });
    if (can('analitica')) steps.push({ key: 'analitica', title: 'Revisa la analítica', description: 'Métricas de uso y resultados del programa.', href: '/dashboard/analitica', icon: 'settings' });
  } else if (role === 'invitado') {
    steps.push({ key: 'discovery', title: 'Completa tu diagnóstico', description: 'Conoce tu perfil de liderazgo en Descubrimiento.', href: '/dashboard/descubrimiento', icon: 'compass' });
  }

  return steps.slice(0, 5);
}

/**
 * Saludo + mensaje personalizado para el encabezado del dashboard, según hora
 * del día, rol y estado real del usuario (no solo el nombre).
 */
export function buildGreeting(
  summary: DashboardSummary | null,
  role: string | null,
  firstName: string,
  nextSteps: NextStep[],
): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const title = firstName ? `${part}, ${firstName}` : part;

  if (!summary) {
    return { title, subtitle: 'Tu panel personalizado para avanzar con foco.' };
  }

  if (summary.firstTime) {
    const byRole: Record<string, string> = {
      lider: 'Bienvenido a 4Shine. Demos el primer paso: completa tu diagnóstico para trazar tu ruta.',
      invitado: 'Tu primer paso es el diagnóstico de Descubrimiento; conocerás tu perfil de liderazgo.',
      mentor: 'Listo para acompañar. Empecemos por revisar a tus líderes y tu agenda.',
      gestor: 'Tienes el control del programa. Empecemos por el panel de seguimiento.',
      admin: 'Tienes el control central. Empecemos por el panel de administración.',
    };
    return { title, subtitle: byRole[role ?? 'lider'] ?? byRole.lider };
  }

  if (role === 'lider') {
    const step = nextSteps[0];
    const hint = step
      ? `Tu siguiente paso: ${step.title.charAt(0).toLowerCase()}${step.title.slice(1)}.`
      : '¡Vas muy bien! Sigue consolidando tu ruta.';
    const base =
      summary.routePercent >= 100
        ? 'Completaste tu ruta.'
        : `Vas ${summary.routePercent}% en tu ruta.`;
    return { title, subtitle: `${base} ${hint}` };
  }

  if (role === 'mentor') {
    const subtitle =
      summary.mentorias.scheduled > 0
        ? `Tienes ${summary.mentorias.scheduled} mentoría(s) próxima(s). Prepárate para acompañar.`
        : 'Revisa a tus líderes y gestiona tu agenda de mentorías.';
    return { title, subtitle };
  }

  if (role === 'gestor' || role === 'admin') {
    return { title, subtitle: 'Seguimiento del programa al día. Revisa usuarios, contenidos y métricas.' };
  }

  return { title, subtitle: 'Continúa tu recorrido en la plataforma.' };
}
