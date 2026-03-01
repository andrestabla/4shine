'use client';

import React, { useMemo, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Bell, Search, Menu, Check, Info, AlertCircle, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import type { Notification } from '@/server/bootstrap/types';

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/trayectoria': 'Trayectoria',
  '/dashboard/aprendizaje': 'Aprendizaje',
  '/dashboard/metodologia': 'Metodología',
  '/dashboard/mentorias': 'Mentorías',
  '/dashboard/networking': 'Networking',
  '/dashboard/convocatorias': 'Convocatorias',
  '/dashboard/mensajes': 'Mensajes',
  '/dashboard/workshops': 'Workshops',
  '/dashboard/perfil': 'Perfil',
  '/dashboard/lideres': 'Líderes',
  '/dashboard/formacion-mentores': 'Formación Mentores',
  '/dashboard/gestion-formacion-mentores': 'Gestión Formación Mentores',
  '/dashboard/usuarios': 'Gestión Usuarios',
  '/dashboard/contenido': 'Gestión Contenido',
  '/dashboard/analitica': 'Analítica',
};

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { currentUser, bootstrapData } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();

  React.useEffect(() => {
    setNotifications(bootstrapData?.notifications ?? []);
  }, [bootstrapData]);

  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard') {
      return `Hola, ${currentUser?.name.split(' ')[0] ?? ''}`;
    }
    return PATH_TITLES[pathname] ?? 'Dashboard';
  }, [pathname, currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'alert':
        return <AlertCircle size={16} className="text-amber-500" />;
      case 'success':
        return <Check size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-slate-500" />;
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate max-w-[220px] md:max-w-none">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 rounded-full bg-slate-100 border-none text-sm focus:ring-2 focus:ring-amber-500 w-64 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in origin-top-right">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700 text-sm">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-amber-600 font-bold hover:underline">
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={clsx(
                        'p-4 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 relative group',
                        !notif.read ? 'bg-amber-50/30' : '',
                      )}
                    >
                      <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className={clsx('text-sm text-slate-800', !notif.read ? 'font-bold' : '')}>{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="absolute right-2 top-2 p-1 rounded-full hover:bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition"
                          title="Marcar como leída"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">No tienes notificaciones</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/20">
            {currentUser?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
