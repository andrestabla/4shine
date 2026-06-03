import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { NotificationSettingsPanel } from '@/components/dashboard/notificaciones/NotificationSettingsPanel';
import { LayoutTemplate, ListChecks, Bell, Send, History } from 'lucide-react';

const CARDS = [
  {
    title: 'Plantillas de mensajes',
    description:
      'Diseña y gestiona las plantillas de email e in-app que la plataforma usa para notificar a los usuarios. Soporta variables dinámicas y vista previa en tiempo real.',
    href: '/dashboard/administracion/notificaciones/plantillas',
    icon: LayoutTemplate,
  },
  {
    title: 'Configuración de eventos',
    description:
      'Activa, desactiva y personaliza cada evento del sistema por módulo: asigna una plantilla, define los canales de envío (email / in-app) y controla quién recibe cada notificación.',
    href: '/dashboard/administracion/notificaciones/eventos',
    icon: ListChecks,
  },
  {
    title: 'Enviar mensajes',
    description:
      'Envía mensajes masivos por email y/o in-app a segmentos de usuarios filtrados por tipo de plan, días restantes de suscripción, rol, país, etc. Usa una plantilla existente o redacta desde cero.',
    href: '/dashboard/administracion/notificaciones/enviar',
    icon: Send,
  },
  {
    title: 'Historial de envíos',
    description:
      'Registro de todos los mensajes que salen de la plataforma (manuales y automáticos), con fecha, remitente, destinatario, estado de entrega y apertura. Cada fila abre el contenido completo.',
    href: '/dashboard/administracion/notificaciones/historial',
    icon: History,
  },
] as const;

export default function NotificacionesAdminPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Mensajes y Notificaciones"
        subtitle="Administra las comunicaciones automáticas de la plataforma: plantillas, canales y eventos por módulo."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="app-list-card block p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-[var(--app-ink)]">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{card.description}</p>
          </Link>
        ))}
      </div>

      <NotificationSettingsPanel />

      <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)] flex gap-3 items-start">
        <Bell size={15} className="mt-0.5 shrink-0 text-[var(--app-ink)]" />
        <div>
          <p className="font-medium text-[var(--app-ink)] mb-1">¿Cómo funciona?</p>
          <p>
            Primero define los <strong>valores globales</strong> arriba (nombre y URL de la plataforma, apariencia del email).
            Luego crea una <strong>plantilla</strong> con el asunto, cuerpo y variables para cada tipo de mensaje.
            Finalmente en <strong>Eventos</strong>, asigna esa plantilla al evento correspondiente y define los canales de envío.
          </p>
        </div>
      </div>
    </div>
  );
}
