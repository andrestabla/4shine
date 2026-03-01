'use client';

import React from 'react';
import { CHATS } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function MensajesPage() {
  return (
    <div>
      <PageTitle title="Mensajes" subtitle="Conversaciones con tu red y equipo." />

      {CHATS.length === 0 ? (
        <EmptyState message="No hay chats activos." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CHATS.map((chat) => (
            <article key={chat.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">Chat #{chat.id}</h3>
                {chat.unread > 0 && <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">{chat.unread}</span>}
              </div>
              <p className="text-xs text-slate-500">Último: {chat.lastMessageTime}</p>
              <p className="text-sm text-slate-700 mt-2 line-clamp-2">{chat.lastMessage}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
