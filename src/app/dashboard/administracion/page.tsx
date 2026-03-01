'use client';

import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { Settings, Palette, PlugZap, Users } from 'lucide-react';

const ADMIN_CARDS = [
  {
    title: 'Gestión de Usuarios',
    description: 'Crear, editar, suspender, eliminar y asignar roles; incluye log de navegación.',
    href: '/dashboard/usuarios',
    icon: Users,
  },
  {
    title: 'Branding y Marca',
    description: 'Configurar identidad visual de la plataforma: colores, logo, loader, tipografía y favicon.',
    href: '/dashboard/administracion/branding',
    icon: Palette,
  },
  {
    title: 'Integraciones',
    description: 'Administrar conectores: Meet, Calendar, R2, Gemini, SSO Google y OpenAI.',
    href: '/dashboard/administracion/integraciones',
    icon: PlugZap,
  },
] as const;

export default function AdministracionPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Administración"
        subtitle="Centro administrativo para gobierno de usuarios, marca e integraciones."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ADMIN_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
              <card.icon size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">{card.title}</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2 items-start">
        <Settings size={16} className="mt-0.5 shrink-0" />
        <p>
          Estas capacidades están agrupadas para rol <strong>Administrador</strong> y accesibles por permiso
          <code className="mx-1">usuarios:manage</code>.
        </p>
      </div>
    </div>
  );
}
