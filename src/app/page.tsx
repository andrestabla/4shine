'use client';

import React from 'react';
import { Gem, GraduationCap, Presentation, Sliders, Check, ChartLine } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Role } from '@/data/mockData';

export default function LoginPage() {
  const { login } = useUser();

  const handleLogin = (role: Role) => {
    login(role);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center mb-12 relative z-10 animate-fade-in">
        <div className="flex justify-center mb-6">
          <Gem className="w-20 h-20 text-yellow-500 animate-pulse-slow drop-shadow-lg" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-3">4Shine Platform</h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">Selecciona tu perfil para comenzar la experiencia personalizada.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4 pb-12 relative z-10">

        {/* Lider Card */}
        <RoleCard
          role="lider"
          title="Soy Líder"
          description="Experiencia de aprendizaje, diagnósticos y networking."
          icon={<GraduationCap className="w-8 h-8 text-amber-600" />}
          features={['Ver Mi Trayectoria', 'Agendar Mentoría']}
          color="amber"
          onClick={() => handleLogin('lider')}
        />

        {/* Mentor Card */}
        <RoleCard
          role="mentor"
          title="Soy Mentor"
          description="Gestión de mentees, agenda y revisión de progreso."
          icon={<Presentation className="w-8 h-8 text-blue-600" />}
          features={['Dashboard de Alumnos', 'Calificar Tareas']}
          color="blue"
          onClick={() => handleLogin('mentor')}
        />

        {/* Gestor Card */}
        <RoleCard
          role="gestor"
          title="Soy Gestor"
          description="Administración de programa, contenidos y analítica."
          icon={<ChartLine className="w-8 h-8 text-teal-600" />}
          features={['Gestión Contenidos', 'Analytics Global']}
          color="teal"
          onClick={() => handleLogin('gestor')}
        />

        {/* Admin Card */}
        <RoleCard
          role="admin"
          title="Soy Admin"
          description="Control total, métricas de cohorte y gestión técnica."
          icon={<Sliders className="w-8 h-8 text-slate-700" />}
          features={['Configuración Global', 'Gestión Usuarios']}
          color="slate"
          onClick={() => handleLogin('admin')}
        />
      </div>

      <p className="text-slate-600 text-xs relative z-10 mt-auto pb-4">v3.0 - Next.js Enterprise Build</p>
    </div>
  );
}

interface RoleCardProps {
  role: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: 'amber' | 'blue' | 'slate' | 'teal';
  onClick: () => void;
}

function RoleCard({ title, description, icon, features, color, onClick }: RoleCardProps) {
  const colorMap = {
    amber: 'border-amber-500 hover:shadow-amber-500/20 group-hover:bg-amber-500',
    blue: 'border-blue-500 hover:shadow-blue-500/20 group-hover:bg-blue-500',
    slate: 'border-slate-600 hover:shadow-slate-500/20 group-hover:bg-slate-800',
    teal: 'border-teal-500 hover:shadow-teal-500/20 group-hover:bg-teal-600',
  };

  const bgIconMap = {
    amber: 'bg-amber-50 group-hover:bg-amber-500 group-hover:text-white',
    blue: 'bg-blue-50 group-hover:bg-blue-500 group-hover:text-white',
    slate: 'bg-slate-100 group-hover:bg-slate-800 group-hover:text-white',
    teal: 'bg-teal-50 group-hover:bg-teal-600 group-hover:text-white',
  };

  const buttonMap = {
    amber: 'group-hover:bg-amber-500 group-hover:text-white',
    blue: 'group-hover:bg-blue-500 group-hover:text-white',
    slate: 'group-hover:bg-slate-800 group-hover:text-white',
    teal: 'group-hover:bg-teal-600 group-hover:text-white',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border-b-4 relative overflow-hidden group ${colorMap[color]}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150 opacity-20 ${color === 'amber' ? 'bg-amber-400' : color === 'blue' ? 'bg-blue-400' : color === 'teal' ? 'bg-teal-400' : 'bg-slate-400'}`}></div>

      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-colors duration-300 shadow-sm ${bgIconMap[color]}`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed min-h-[40px]">{description}</p>

      <div className="space-y-3 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center text-sm text-slate-600 font-medium">
            <Check className="w-4 h-4 text-green-500 mr-2 stroke-[3]" /> {f}
          </div>
        ))}
      </div>

      <button className={`w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl transition-all duration-300 shadow-sm border border-slate-200 ${buttonMap[color]}`}>
        Ingresar Demo
      </button>
    </div>
  );
}
