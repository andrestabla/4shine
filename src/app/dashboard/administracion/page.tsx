'use client';

import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { Settings, Palette, PlugZap, Users, ShieldCheck, Globe, Bell, CreditCard, Receipt, Compass, Bot, FileCode2, Webhook, Power } from 'lucide-react';

const ADMIN_CARDS = [
  {
    title: 'Gestión de Usuarios',
    description: 'Crear, editar, suspender, eliminar y asignar roles; incluye log de navegación.',
    href: '/dashboard/usuarios',
    module: 'usuarios' as ModuleCode,
    action: 'view' as PermissionAction,
    icon: Users,
  },
  {
    title: 'Branding y Marca',
    description: 'Configurar identidad visual de la plataforma: colores, logo, loader, tipografía y favicon.',
    href: '/dashboard/administracion/branding',
    module: 'branding' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Palette,
  },
  {
    title: 'Mensajes y Notificaciones',
    description: 'Crear plantillas de email e in-app con variables dinámicas y configurar qué eventos disparan cada notificación.',
    href: '/dashboard/administracion/notificaciones',
    module: 'notificaciones' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Bell,
  },
  {
    title: 'Planes y Precios',
    description: 'Crear, editar, activar o desactivar los planes de suscripción y definir el acceso a cada módulo de la plataforma.',
    href: '/dashboard/administracion/planes',
    module: 'planes' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: CreditCard,
  },
  {
    title: 'Integraciones',
    description: 'Administrar conectores: Meet, Calendar, R2, Gemini, SSO Google, OpenAI, Stripe, Wompi y GoHighLevel.',
    href: '/dashboard/administracion/integraciones',
    module: 'integraciones' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: PlugZap,
  },
  {
    title: 'Módulos',
    description: 'Encender o apagar módulos y submódulos de la plataforma para todos los usuarios.',
    href: '/dashboard/administracion/modulos',
    module: 'modulos' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Power,
  },
  {
    title: 'GoHighLevel (GHL)',
    description: 'Reporte de webhooks de compra recibidos, alta automática de usuarios, asignación de plan y mapeo de productos.',
    href: '/dashboard/administracion/ghl',
    module: 'ghl' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Webhook,
  },
  {
    title: 'Pagos de mentorías',
    description: 'Historial de transacciones, intentos por proveedor y gestión de reembolsos (Stripe / Wompi).',
    href: '/dashboard/administracion/pagos',
    module: 'pagos' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Receipt,
  },
  {
    title: 'Política de Privacidad',
    description: 'Editar el texto de la política de privacidad que los usuarios deben aceptar al ingresar.',
    href: '/dashboard/administracion/politicas',
    module: 'politicas' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: ShieldCheck,
  },
  {
    title: 'Site',
    description: 'Habilitar u ocultar las páginas públicas del sitio: home, diagnóstico, metodología, precios y afiliados.',
    href: '/dashboard/administracion/site',
    module: 'site' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Globe,
  },
  {
    title: 'Tour de Onboarding',
    description: 'Configurar el recorrido guiado del primer ingreso: pasos por rol, reinicio para todos y analítica de vistas.',
    href: '/dashboard/administracion/tour',
    module: 'tour' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Compass,
  },
  {
    title: 'Asistente IA',
    description: 'Configurar el chatbot de soporte 360: estado, persona, instrucciones, base de conocimiento (FAQs) y revisión de conversaciones.',
    href: '/dashboard/administracion/asistente-ia',
    module: 'asistente_ia' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: Bot,
  },
  {
    title: 'Documentación técnica',
    description: 'Cómo está construida la plataforma (arquitectura, base de datos, permisos) y cómo funciona cada módulo del sistema.',
    href: '/dashboard/administracion/documentacion',
    module: 'documentacion' as ModuleCode,
    action: 'manage' as PermissionAction,
    icon: FileCode2,
  },
] as const;

export default function AdministracionPage() {
  const { can } = useUser();
  // Cada área del panel tiene su propio módulo de permisos: la tarjeta se ve
  // solo si el rol lo tiene concedido en la matriz. `usuarios` ya no es la
  // llave maestra del panel: solo abre la gestión de usuarios.
  const cards = ADMIN_CARDS.filter((card) => can(card.module, card.action));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Administración"
        subtitle="Centro administrativo para gobierno de usuarios, marca e integraciones."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="app-list-card block p-5"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-[var(--app-ink)]">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 flex gap-2 items-start">
        <Settings size={16} className="mt-0.5 shrink-0" />
        <p>
          Estas capacidades están reservadas para el rol <strong>Administrador</strong>.
        </p>
      </div>
    </div>
  );
}
