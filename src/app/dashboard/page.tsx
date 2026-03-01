'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import { useSearchParams } from 'next/navigation';
import {
    Rocket, Calendar, ClipboardCheck, Network,
    Users, Video, CheckSquare, Star,
    Layers, HeartPulse, Server, Search, Filter, MapPin, Building,
    Clock, Heart, ArrowRight, BookOpen, Check, LogOut,
    Briefcase, Award, Link, PenTool, Edit2,
    Flag, Target, Zap, MessageCircle, MessageSquare, UserPlus, Send, Lock, X, Plus, Trash2, Linkedin, Camera, Book, FileText, Monitor, Mic, Package, Globe, SlidersHorizontal, ThumbsUp, Hash, Share2, Edit, PieChart, Upload, Sparkles, Medal, Trophy
} from 'lucide-react';
import RadarChart from '@/components/RadarChart';
import { MENTEES, NETWORKING, JOBS, TIMELINE, LEARNING_CONTENT, LearningItem, METHODOLOGY_CONTENT, MethodologyResource, Comment, MENTORSHIPS, MentorshipSession, INTEREST_GROUPS, NetworkingContact, Job, CHATS, Chat, Message, NOTIFICATIONS, Notification, QUOTES, Quote, NEWS_UPDATES, NewsUpdate, AVAILABLE_MENTORS, Mentor, USERS, WORKSHOPS, Workshop, MENTOR_TRAINING, MENTOR_ASSIGNMENTS, LEADER_TRAINING } from '@/data/mockData';
import clsx from 'clsx';

export default function DashboardPage() {
    const { currentUser, currentRole } = useUser();
    const router = require('next/navigation').useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'dashboard';

    // HU 10.3: Mensaje Motivador (Random Selection)
    const [quote, setQuote] = React.useState<Quote>(QUOTES[0]);
    const [selectedNews, setSelectedNews] = React.useState<NewsUpdate | null>(null);

    React.useEffect(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    if (!currentUser) return null;

    // --- RENDER VISUALIZACIONES PRINCIPALES ---
    const renderDashboardContent = () => {
        if (currentRole === 'lider') {
            return (
                <>
                    {/* KPIs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        <KPICard label="Nivel Actual" value="Explorador" footer="35% completado" icon={Rocket} color="amber" />
                        <KPICard label="Próxima Mentoría" value="Mañana 10AM" footer="Sesión Grupal" icon={Calendar} color="blue" />
                        <KPICard label="Puntaje Test" value="72/100" footer="+5 pts mes anterior" icon={ClipboardCheck} color="green" />
                        <KPICard label="Conexiones" value="12" footer="2 pendientes" icon={Network} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Feed / Main Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="font-bold text-lg text-slate-700 border-b border-slate-200 pb-2">Tu actividad reciente</h3>
                            {/* Feed Items Mock */}
                            <FeedItem title="Comunicación Asertiva" desc="Nuevo módulo habilitado basado en tu último test." time="Hace 2h" type="content" />
                            <FeedItem title="Nuevo en la comunidad" desc="Alejandro G. se ha unido a la Cohorte 3." time="Hace 4h" type="social" />
                            <FeedItem title="Mantenimiento Programado" desc="La plataforma se actualizará el domingo a las 3AM." time="Hace 1d" type="system" />
                        </div>

                        {/* Sidebar Widgets */}
                        <div className="space-y-6">
                            {/* HU 10.3: Mensaje Motivador Dinámico */}
                            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 text-slate-700/20 text-9xl font-serif">"</div>
                                <p className="relative z-10 text-sm italic mb-4 font-medium leading-relaxed">"{quote.text}"</p>
                                <p className="relative z-10 text-xs text-amber-500 font-bold tracking-wider">- {quote.author}</p>
                            </div>

                            {/* HU 10.4: Noticias y Comunicaciones */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-700">Novedades</h4>
                                    <Globe className="text-slate-400" size={16} />
                                </div>
                                <div className="space-y-4">
                                    {NEWS_UPDATES.map(news => (
                                        <div
                                            key={news.id}
                                            onClick={() => setSelectedNews(news)}
                                            className="flex gap-3 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors"
                                        >
                                            <div className={clsx("w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-sm", news.image)}>
                                                {news.category.substring(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors leading-tight mb-1">{news.title}</h5>
                                                <p className="text-[10px] text-slate-500 line-clamp-2">{news.summary}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Heart size={8} /> {news.likes || 12}</span>
                                                    <span className="text-[9px] text-slate-400 focus:text-amber-500 decoration-amber-500 font-bold hover:underline">Leer más</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 py-2 border-t border-slate-100 transition">Ver todas las noticias</button>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-700">Progreso por Pilar</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                                </div>
                                <div className="h-[200px]">
                                    <RadarChart mini={true} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (currentRole === 'mentor') {
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        <KPICard label="Mentees Activos" value="15" footer="2 requieren atención" icon={Users} color="blue" />
                        <KPICard label="Sesiones Hoy" value="3" footer="Próxima en 15m" icon={Video} color="amber" />
                        <KPICard label="Tareas Revisadas" value="12/15" footer="3 pendientes" icon={CheckSquare} color="green" />
                        <KPICard label="Valoración" value="4.9/5.0" footer="Excelente" icon={Star} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        <div className="lg:col-span-2">
                            <h3 className="font-bold text-lg text-slate-700 mb-4">Estado de Estudiantes (Riesgo)</h3>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                            <tr>
                                                <th className="p-4">Estudiante</th>
                                                <th className="p-4">Empresa</th>
                                                <th className="p-4">Progreso</th>
                                                <th className="p-4">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {MENTEES.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50 transition cursor-pointer">
                                                    <td className="p-4 font-medium text-slate-800">{m.name}</td>
                                                    <td className="p-4 text-slate-500">{m.company}</td>
                                                    <td className="p-4 w-32">
                                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-1">
                                                            <div className={clsx("h-1.5 rounded-full", m.progress > 50 ? 'bg-slate-800' : 'bg-red-500')} style={{ width: `${m.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-xs text-slate-400">{m.progress}%</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={clsx("px-2 py-1 rounded text-xs font-bold",
                                                            m.status === 'danger' ? 'bg-red-100 text-red-600' :
                                                                m.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                                    'bg-green-100 text-green-600'
                                                        )}>
                                                            {m.status === 'danger' ? 'Crítico' : m.status === 'warning' ? 'Atención' : 'Bien'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-700 mb-4">Agenda Hoy</h3>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition cursor-pointer group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">10:00 AM - Sofía M.</p>
                                            <p className="text-xs text-slate-500 mt-1">Revisión Shine Within</p>
                                        </div>
                                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition font-bold">Unirse</button>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition cursor-pointer">
                                    <p className="font-bold text-slate-800">02:00 PM - Grupo B</p>
                                    <p className="text-xs text-slate-500 mt-1">Taller Liderazgo Ágil</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (currentRole === 'gestor') {
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        <KPICard label="Contenido Gestionado" value="45" footer="8 nuevas piezas este mes" icon={BookOpen} color="teal" />
                        <KPICard label="Revisiones Pendientes" value="8" footer="Prioridad Alta" icon={CheckSquare} color="amber" />
                        <KPICard label="Satisfacción Programa" value="4.8/5" footer="NPS +60" icon={Star} color="purple" />
                        <KPICard label="Líderes Activos" value="128" footer="85% Engagement" icon={Users} color="blue" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-700">Aprobaciones Recientes</h3>
                                <button className="text-sm text-teal-600 font-bold hover:underline">Ver Todo</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs">PDF</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Guía de Feedback.pdf</p>
                                            <p className="text-xs text-slate-400">Subido por Mentor Carlos</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
                                        <button className="p-1 text-red-600 hover:bg-red-100 rounded"><LogOut size={16} className="rotate-180" /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-xs">VID</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Masterclass Liderazgo</p>
                                            <p className="text-xs text-slate-400">Subido por Admin</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
                                        <button className="p-1 text-red-600 hover:bg-red-100 rounded"><LogOut size={16} className="rotate-180" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-lg text-slate-700 mb-6">Alertas de Progreso</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 border-l-4 border-red-500 bg-red-50/50">
                                    <HeartPulse className="text-red-500" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Bajo Engagement - Cohorte 3</p>
                                        <p className="text-xs text-slate-500">3 líderes no han ingresado en 7 días.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border-l-4 border-amber-500 bg-amber-50/50">
                                    <Clock className="text-amber-500" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Mentorías Pendientes</p>
                                        <p className="text-xs text-slate-500">5 sesiones requieren re-agendamiento.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (currentRole === 'admin') {
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        <KPICard label="Total Usuarios" value="342" footer="+12 esta semana" icon={Users} color="slate" />
                        <KPICard label="Cohortes Activas" value="3" footer="Cohorte 4 en setup" icon={Layers} color="indigo" />
                        <KPICard label="Engagement" value="78%" footer="Diario Promedio" icon={HeartPulse} color="red" />
                        <KPICard label="System Status" value="Ok" footer="Uptime 99.9%" icon={Server} color="green" />
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-700">Analítica Global</h3>
                        <p className="text-slate-500 text-sm mb-6">Visualización de prueba para perfil Administrador</p>
                        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <span className="text-slate-400">Chart Placeholder (Activity Log)</span>
                        </div>
                    </div>
                </>
            );
        }
    };

    // --- RENDER VISTAS SECUNDARIAS ---

    const renderSecondaryView = () => {
        if (currentView === 'networking') {
            return <NetworkingManager />;
        }

        if (currentView === 'convocatorias') {
            return <JobsManager />;
        }

        if (currentView === 'mensajes') {
            return <MessagesManager />;
        }

        if (currentView === 'trayectoria') {
            // Gestor sees global trajectories, others see their own trajectory
            if (currentRole === 'gestor') {
                return <MenteeTrajectoriesManager />;
            }
            return <TrajectoryManager />;
        }

        if (currentView === 'aprendizaje') {
            // Gestor sees Learning Manager with CMS, others see Learning Module
            if (currentRole === 'gestor') {
                return <LearningManager />;
            }
            return <LearningModule />;
        }

        if (currentView === 'perfil') {
            return <ProfileManager user={currentUser} />;
        }

        if (currentView === 'metodologia') {
            return <MethodologyManager />;
        }

        if (currentView === 'lideres') {
            return <MenteeTrajectoriesManager />;
        }

        if (currentView === 'mentorias') {
            return <MentorshipManager />;
        }

        if (currentView === 'workshops') {
            return <WorkshopsManager />;
        }

        if (currentView === 'formacion-mentores') {
            return <MentorTrainingView />;
        }

        if (currentView === 'gestion-formacion-mentores') {
            return <GestorMentorTrainingView />;
        }

        // Default placeholder for other views
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 animate-fade-in">
                <Layers className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-slate-600">En Construcción</h3>
                <p>La vista <span className="font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded">{currentView}</span> estará disponible pronto.</p>
            </div>
        );
    };


    // --- HEADER COMÚN ---
    return (
        <div>
            <header className="flex justify-between items-end mb-8 animate-fade-in">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
                            {currentRole} View
                        </span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        <span className="text-slate-400 font-light">Hola,</span> {currentUser.name.split(' ')[0]}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/dashboard?view=mensajes')}
                        className={`p-2.5 px-4 rounded-full shadow-sm text-slate-500 hover:text-amber-600 transition font-medium text-sm border border-slate-200 flex items-center gap-2 group ${currentView === 'mensajes' ? 'bg-slate-800 text-white hover:text-white' : 'bg-white'}`}
                    >
                        <div className="relative">
                            <MessageSquare size={18} />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <span className="hidden md:inline">Mensajes</span>
                    </button>
                    {/* Removed confusing Heart Icon as per user feedback */}
                </div>
            </header>

            {/* Modal de Noticias */}
            {selectedNews && (
                <NewsViewer news={selectedNews} onClose={() => setSelectedNews(null)} />
            )}

            {currentView === 'dashboard' ? renderDashboardContent() : renderSecondaryView()}
        </div>
    );
}

// --- SUB-COMPONENTES SIMPLES ---

function KPICard({ label, value, footer, icon: Icon, color }: { label: string, value: string, footer: string, icon: any, color: string }) {

    const colorStyles = {
        amber: "border-amber-500 text-amber-600",
        blue: "border-blue-500 text-blue-600",
        green: "border-green-500 text-green-600",
        purple: "border-purple-500 text-purple-600",
        slate: "border-slate-500 text-slate-600",
        indigo: "border-indigo-500 text-indigo-600",
        red: "border-red-500 text-red-600",
    }[color] || "border-slate-500 text-slate-600";

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${colorStyles.split(' ')[0]} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-opacity-10 ${colorStyles.split(' ')[0].replace('border', 'bg').replace('-500', '-50')}`}>
                    <Icon className={`w-6 h-6 ${colorStyles.split(' ')[1]}`} />
                </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3 flex items-center gap-1">
                {footer}
            </p>
        </div>
    );
}

// --- COMPONENTE VISUALIZADOR DE TRAYECTORIA (HU 4.2) ---
function MenteeDetailView({ menteeId, onBack }: { menteeId: number, onBack: () => void }) {
    const mentee = MENTEES.find(m => m.id === menteeId);

    // Simulate fetching full user details
    const fullUser = menteeId === 1 ? USERS.lider : {
        ...USERS.lider,
        name: mentee?.name || "Líder",
        company: mentee?.company || "",
        stats: { progress: mentee?.progress || 0, tests: 2, connections: 8 },
        testResults: { shineWithin: 70, shineOut: 60, shineUp: 50, shineBeyond: 40 }
    };

    // Simulate Timeline Data based on user
    const timelineEvents = [
        { date: "2024-01-10", title: "Inicio del Programa", type: "system", desc: "Activación de cuenta y bienvenida." },
        { date: "2024-01-15", title: "Diagnóstico Inicial", type: "test", desc: "Completado assessment 360 con puntaje base." },
        { date: "2024-01-20", title: "Mentoría: Definición de Objetivos", type: "session", desc: "Sesión 1:1 con Dr. Carlos Ruiz." },
        { date: "2024-02-05", title: "Masterclass: Shine Within", type: "content", desc: "Asistencia confirmada." },
        { date: "2024-02-15", title: "Entrega de Plan de Acción", type: "deliverable", desc: "Documento v1.0 subido." },
    ];

    return (
        <div className="animate-fade-in max-w-6xl mx-auto md:pr-4">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 group transition-colors">
                <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">Volver a la lista</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lateral: Profile & Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-800 to-slate-900"></div>
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg relative z-10 mt-12 mb-4">
                            <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-600">
                                {fullUser.name.charAt(0)}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{fullUser.name}</h2>
                        <p className="text-slate-500 text-sm mb-4">{fullUser.role} en {fullUser.company}</p>

                        <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">{mentee?.planType || 'Standard'}</span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">{mentee?.seniority || 'Manager'}</span>
                        </div>

                        <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                            <div><p className="text-xs text-slate-400 uppercase">Progreso</p><p className="font-bold text-slate-800">{fullUser.stats.progress}%</p></div>
                            <div><p className="text-xs text-slate-400 uppercase">Tests</p><p className="font-bold text-slate-800">{fullUser.stats.tests}</p></div>
                            <div><p className="text-xs text-slate-400 uppercase">Sesiones</p><p className="font-bold text-slate-800">4/12</p></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Target size={18} /> Resultados Diagnóstico
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>Within</span><span>{fullUser.testResults?.shineWithin}%</span></div>
                                <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${fullUser.testResults?.shineWithin}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>Out</span><span>{fullUser.testResults?.shineOut}%</span></div>
                                <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${fullUser.testResults?.shineOut}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>Up</span><span>{fullUser.testResults?.shineUp}%</span></div>
                                <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${fullUser.testResults?.shineUp}%` }}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>Beyond</span><span>{fullUser.testResults?.shineBeyond}%</span></div>
                                <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${fullUser.testResults?.shineBeyond}%` }}></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                        <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><Edit2 size={16} /> Notas del Mentor</h3>
                        <textarea className="w-full bg-white border border-yellow-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-yellow-400 resize-none h-32" placeholder="Escribe notas privadas sobre este líder..."></textarea>
                        <button className="mt-2 w-full bg-yellow-400 text-yellow-900 font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors text-xs uppercase tracking-wide">Guardar Nota</button>
                    </div>
                </div>

                {/* Main: Timeline */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Trayectoria del Programa</h2>
                        <button className="text-sm font-bold text-amber-600 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">+ Añadir Hito</button>
                    </div>

                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pl-8 pb-4">
                        {timelineEvents.map((event, idx) => (
                            <div key={idx} className="relative group">
                                <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm
                                    ${event.type === 'system' ? 'bg-slate-400' :
                                        event.type === 'test' ? 'bg-indigo-500' :
                                            event.type === 'session' ? 'bg-emerald-500' :
                                                event.type === 'content' ? 'bg-purple-500' : 'bg-amber-500'
                                    }`}></div>

                                <span className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">{event.date}</span>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{event.title}</h4>
                                <p className="text-slate-500 mt-1">{event.desc}</p>
                                {event.type === 'deliverable' && (
                                    <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 max-w-md cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                                        <FileText className="text-red-400" size={20} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Plan_Accion_v1.pdf</p>
                                            <p className="text-[10px] text-slate-400">2.4 MB • PDF</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="relative">
                            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-100 border-4 border-white shadow-sm animate-pulse"></div>
                            <h4 className="text-lg font-bold text-slate-300 italic">Próximos pasos...</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE GESTOR DE APRENDIZAJE (HU 5.1 & HU 5.2) ---
function LearningManager() {
    const [resources, setResources] = React.useState(LEADER_TRAINING);
    const [selectedResource, setSelectedResource] = React.useState<LearningItem | null>(null);
    const [commentText, setCommentText] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("Todos");
    const [selectedType, setSelectedType] = React.useState<string>("Todos");
    const { currentUser, currentRole } = useUser();

    // HU 5.1: CMS for Gestor
    const isGestor = currentRole === 'gestor';
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState<Partial<LearningItem>>({});
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<number | null>(null);

    const [showAnalytics, setShowAnalytics] = React.useState(false);
    const [inputType, setInputType] = React.useState<'url' | 'file'>('url');

    // Search and Filter States
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showOnlyLiked, setShowOnlyLiked] = React.useState(false);
    const [showRecommendedOnly, setShowRecommendedOnly] = React.useState(true);

    // Filtros - Updated to match LEADER_TRAINING categories
    const categories = ["Todos", "Liderazgo", "Gestión", "Habilidades Blandas", "Comunicación", "Estrategia", "Productividad", "Innovación", "Cultura", "Finanzas", "Marketing", "Gestión del Cambio", "Ética", "Bienestar", "Inclusión", "Tecnología", "Mentoring", "Desarrollo"];
    const types = ["Todos", "scorm", "video", "pdf", "podcast", "article"];

    const filteredResources = resources.filter(r => {
        const matchCategory = selectedCategory === "Todos" || r.category === selectedCategory;
        const matchType = selectedType === "Todos" || r.type === selectedType;
        const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchLiked = !showOnlyLiked || r.liked;
        // Logic for recommended: if showRecommendedOnly is true, show only recommended items. 
        // BUT, if the user explicitly searches or filters, we might want to relax this? 
        // For now, let's make it a strict toggle. If 'Recomendados' is active, only show recommended.
        const matchRecommended = !showRecommendedOnly || r.isRecommended;

        return matchCategory && matchType && matchSearch && matchLiked && matchRecommended;
    });

    const getIconForType = (type: string) => {
        switch (type) {
            case 'video': return <Video size={32} />;
            case 'podcast': return <Mic size={32} />;
            case 'article': return <FileText size={32} />;
            case 'scorm': return <Package size={32} />;
            default: return <BookOpen size={32} />;
        }
    };

    const getColorForType = (type: string) => {
        switch (type) {
            case 'video': return 'bg-red-50 text-red-500';
            case 'podcast': return 'bg-purple-50 text-purple-500';
            case 'article': return 'bg-blue-50 text-blue-500';
            case 'scorm': return 'bg-indigo-50 text-indigo-500';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const handleLike = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setResources(resources.map(r => {
            if (r.id === id) {
                return { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 };
            }
            return r;
        }));

        if (selectedResource && selectedResource.id === id) {
            setSelectedResource(prev => prev ? { ...prev, liked: !prev.liked, likes: !prev.liked ? prev.likes + 1 : prev.likes - 1 } : null);
        }
    };

    const handleAddComment = () => {
        if (!commentText.trim() || !selectedResource) return;

        const newComment: Comment = {
            id: Date.now(),
            author: currentUser?.name || "Usuario",
            avatar: currentUser?.avatar,
            text: commentText,
            date: new Date().toISOString().split('T')[0],
            role: currentUser?.role || 'Mentor'
        };

        const updatedResource = {
            ...selectedResource,
            commentsArray: [...(selectedResource.commentsArray || []), newComment]
        };

        setSelectedResource(updatedResource);
        setResources(resources.map(r => r.id === selectedResource.id ? updatedResource : r));
        setCommentText("");
    };

    // HU 5.1: CRUD Handlers for Gestor
    const handleCreateResource = () => {
        if (!editForm.title || !editForm.type || !editForm.category) return;

        const newResource: LearningItem = {
            id: Date.now(),
            title: editForm.title,
            type: editForm.type as any,
            category: editForm.category,
            duration: editForm.duration || "45 min", // Default for SCORM/courses
            date: new Date().toISOString().split('T')[0],
            author: currentUser?.name || "Gestor",
            likes: 0,
            liked: false,
            isRecommended: true, // Default
            progress: 0,
            tags: editForm.tags || ["General"],
            commentsArray: [],
            url: editForm.url || "#",
            seen: false
        };

        setResources([newResource, ...resources]);
        setShowCreateModal(false);
        setEditForm({});
    };

    const handleEditResource = () => {
        if (!selectedResource || !editForm.title) return;

        const updatedResource = {
            ...selectedResource,
            ...editForm
        };

        setResources(resources.map(r => r.id === selectedResource.id ? updatedResource : r));
        setSelectedResource(updatedResource);
        setIsEditing(false);
        setEditForm({});
    };

    const handleDeleteResource = (id: number) => {
        setResources(resources.filter(r => r.id !== id));
        setShowDeleteConfirm(null);
        if (selectedResource?.id === id) {
            setSelectedResource(null);
        }
    };

    const startEdit = (resource: LearningItem) => {
        setEditForm({
            title: resource.title,
            type: resource.type,
            category: resource.category,
            duration: resource.duration,
            tags: resource.tags
        });
        setIsEditing(true);
    };

    // HU 5.2: Analytics calculations
    const analytics = {
        totalContent: resources.length,
        byType: {
            video: resources.filter(r => r.type === 'video').length,
            pdf: resources.filter(r => r.type === 'pdf').length,
            podcast: resources.filter(r => r.type === 'podcast').length,
            article: resources.filter(r => r.type === 'article').length,
            scorm: resources.filter(r => r.type === 'scorm').length,
        },
        mostViewed: [...resources].sort((a, b) => (b.likes + b.commentsArray.length) - (a.likes + a.commentsArray.length)).slice(0, 5),
        byCategory: categories.filter(c => c !== 'Todos').map(cat => ({
            name: cat,
            count: resources.filter(r => r.category === cat).length
        }))
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestión del Aprendizaje</h1>
                    <p className="text-slate-500">Repositorio de contenidos para tu desarrollo continuo.</p>
                </div>

                <div className="flex flex-col gap-4 w-full md:w-auto">

                    <div className="flex gap-2 items-center flex-wrap justify-end">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar temas, tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-64 transition-all"
                            />
                        </div>


                        {isGestor && (
                            <>
                                <button
                                    onClick={() => setShowAnalytics(!showAnalytics)}
                                    className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                                    title="Ver Analítica"
                                >
                                    <PieChart size={18} />
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 shadow-md transition-all hover:scale-105"
                                >
                                    <Plus size={16} /> Crear
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex gap-2 items-center flex-wrap justify-end">
                        {/* Toggle Recommended */}
                        <button
                            onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${showRecommendedOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Sparkles size={14} className={showRecommendedOnly ? "fill-current" : ""} />
                            Recomendados
                        </button>

                        {/* Toggle Liked */}
                        <button
                            onClick={() => setShowOnlyLiked(!showOnlyLiked)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${showOnlyLiked ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Heart size={14} className={showOnlyLiked ? "fill-current" : ""} />
                            Mis Favoritos
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Filtrar:</span>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="text-xs border-none bg-transparent focus:ring-0 text-slate-600 font-bold cursor-pointer hover:text-amber-600 py-1"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <div className="w-px h-4 bg-slate-100"></div>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="text-xs border-none bg-transparent focus:ring-0 text-slate-600 font-bold cursor-pointer hover:text-amber-600 py-1"
                            >
                                {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* HU 5.2: Analytics Dashboard for Gestor */}
            {isGestor && showAnalytics && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Analítica de Contenidos</h2>
                        <button
                            onClick={() => setShowAnalytics(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <BookOpen size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{analytics.totalContent}</p>
                                    <p className="text-xs text-slate-500">Total Contenidos</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-bold text-slate-600 mb-3">Por Tipo</p>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span>Videos:</span> <span className="font-bold">{analytics.byType.video}</span></div>
                                <div className="flex justify-between"><span>PDFs:</span> <span className="font-bold">{analytics.byType.pdf}</span></div>
                                <div className="flex justify-between"><span>Podcasts:</span> <span className="font-bold">{analytics.byType.podcast}</span></div>
                                <div className="flex justify-between"><span>Artículos:</span> <span className="font-bold">{analytics.byType.article}</span></div>
                                <div className="flex justify-between"><span>SCORM:</span> <span className="font-bold">{analytics.byType.scorm}</span></div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <p className="text-xs font-bold text-slate-600 mb-3">Por Módulo</p>
                            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                                {analytics.byCategory.map(cat => (
                                    <div key={cat.name} className="flex justify-between">
                                        <span>{cat.name}:</span>
                                        <span className="font-bold">{cat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <p className="text-sm font-bold text-slate-800 mb-3">Top 5 Más Consultados</p>
                        <div className="space-y-2">
                            {analytics.mostViewed.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                    <span className="text-lg font-bold text-slate-300 w-6">{idx + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">{item.title}</p>
                                        <p className="text-xs text-slate-400">{item.category} • {item.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-indigo-600">{item.likes + item.commentsArray.length}</p>
                                        <p className="text-xs text-slate-400">interacciones</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {filteredResources.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Search size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No se encontraron recursos con los filtros seleccionados.</p>
                    </div>
                )}

                {filteredResources.map(resource => (
                    <div key={resource.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group relative">
                        {/* Gestor Admin Controls */}
                        {isGestor && (
                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedResource(resource);
                                        startEdit(resource);
                                    }}
                                    className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm"
                                    title="Editar contenido"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(resource.id);
                                    }}
                                    className="p-2 bg-white text-red-600 rounded-lg border border-red-100 hover:bg-red-50 transition-colors shadow-sm"
                                    title="Eliminar contenido"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        <div className={`p-4 rounded-lg shrink-0 ${getColorForType(resource.type)}`} onClick={() => setSelectedResource(resource)}>
                            {getIconForType(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedResource(resource)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase tracking-wider">{resource.category}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-400 uppercase tracking-wider">{resource.type}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{resource.title}</h3>
                                </div>
                                <button
                                    onClick={(e) => handleLike(e, resource.id)}
                                    className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full transition-colors ${resource.liked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Heart size={16} className={resource.liked ? "fill-current" : ""} />
                                    {resource.likes}
                                </button>
                            </div>
                            <p className="text-slate-600 mt-2 text-sm line-clamp-2">Contenido educativo curado para el desarrollo de competencias de liderazgo.</p>
                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Users size={12} /> {resource.author || 'Carmenza Alarcón'}</span>
                                <span>• {resource.date}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={12} /> {resource.commentsArray?.length || 0}</span>
                                <div className="flex gap-1 ml-auto">
                                    {resource.tags?.map(tag => (
                                        <span key={tag} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-400">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Detail */}
            {selectedResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedResource(null)}>
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${getColorForType(selectedResource.type)}`}>
                                    {getIconForType(selectedResource.type)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{selectedResource.title}</h2>
                                    <p className="text-slate-500 text-xs flex gap-2">
                                        <span>{selectedResource.category}</span>
                                        <span>•</span>
                                        <span>{selectedResource.author || 'Carmenza Alarcón'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isGestor && (
                                    <button
                                        onClick={() => startEdit(selectedResource)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mr-2"
                                    >
                                        <Edit size={16} />
                                        <span>Editar</span>
                                    </button>
                                )}
                                <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 grid grid-cols-1 lg:grid-cols-3 bg-slate-50">
                            <div className="lg:col-span-2 p-8 overflow-y-auto">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] mb-8 overflow-hidden relative p-0 bg-black">
                                    {selectedResource.url && selectedResource.url !== '#' ? (
                                        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-black">
                                            {selectedResource.type === 'video' ? (
                                                <video controls className="w-full h-full max-h-[600px] object-contain" src={selectedResource.url}>
                                                    Tu navegador no soporta video HTML5.
                                                </video>
                                            ) : selectedResource.url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i) ? (
                                                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedResource.url)}`} className="w-full h-[600px] border-none bg-white" title="Office Viewer" />
                                            ) : selectedResource.type === 'pdf' || selectedResource.type === 'html' || selectedResource.type === 'scorm' ? (
                                                <iframe src={selectedResource.url} className="w-full h-[600px] border-none bg-white" title="Visor de Contenido" />
                                            ) : (['article', 'ppt', 'podcast'].includes(selectedResource.type) || selectedResource.url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                                selectedResource.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                    <img src={selectedResource.url} alt={selectedResource.title} className="max-w-full max-h-[600px] object-contain" />
                                                ) : (
                                                    <iframe src={selectedResource.url} className="w-full h-[600px] border-none bg-white" />
                                                )
                                            ) : (
                                                <div className="text-white">Formato no soportado para vista previa.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center p-10 text-center bg-white w-full h-full py-20">
                                            <div className="mb-6 transform hover:scale-110 transition-transform duration-500">
                                                {getIconForType(selectedResource.type)}
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Visualización no disponible</h3>
                                            <p className="text-slate-500 mb-8 max-w-md">Este recurso no tiene una URL válida configurada para visualización en línea. Por favor verifica el enlace.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-50 pb-2">Detalles</h3>
                                        <p className="text-slate-600 leading-relaxed">Este recurso forma parte del módulo "{selectedResource.category}" y está diseñado para fortalecer tus competencias en liderazgo estratégico.</p>
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {selectedResource.tags?.map(tag => (
                                                <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                                    <Hash size={12} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={(e) => handleLike(e, selectedResource.id)}
                                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedResource.liked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <Heart size={20} className={selectedResource.liked ? "fill-current" : ""} />
                                            {selectedResource.liked ? 'Te gusta' : 'Me gusta'} ({selectedResource.likes})
                                        </button>
                                        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                            <Share2 size={20} /> Compartir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-white border-l border-slate-100 flex flex-col h-full">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-amber-500" />
                                        Comentarios ({selectedResource.commentsArray?.length || 0})
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {selectedResource.commentsArray?.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 italic">
                                            Sé el primero en comentar.
                                        </div>
                                    ) : (
                                        selectedResource.commentsArray?.map(comment => (
                                            <div key={comment.id} className="group">
                                                <div className="flex gap-3 items-start">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                                                        {comment.avatar || comment.author.charAt(0)}
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 w-full">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-xs text-slate-700">{comment.author}</span>
                                                            <span className="text-[10px] text-slate-400">{comment.date}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600">{comment.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Escribe un comentario..."
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="bg-amber-500 text-white p-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
// MODALES PARA LEARNINGMANAGER - COPIAR ANTES DEL CIERRE DEL COMPONENTE (línea 1002)

            {/* HU 5.1: Create/Edit Content Modal for Gestor */}
            {(showCreateModal || isEditing) && isGestor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateModal(false); setIsEditing(false); setEditForm({}); }}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? 'Editar Contenido' : 'Crear Nuevo Contenido'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Título *</label>
                                <input
                                    type="text"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: Liderazgo Transformacional"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo *</label>
                                    <select
                                        value={editForm.type || ''}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="video">Video</option>
                                        <option value="pdf">PDF</option>
                                        <option value="podcast">Podcast</option>
                                        <option value="article">Artículo</option>
                                        <option value="scorm">SCORM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Módulo *</label>
                                    <select
                                        value={editForm.category || ''}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.filter(c => c !== 'Todos').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Duración</label>
                                <input
                                    type="text"
                                    value={editForm.duration || ''}
                                    onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: 45 min"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fuente del Contenido</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setInputType('url')}
                                    >
                                        Enlace Externo
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setInputType('file')}
                                    >
                                        Subir Archivo
                                    </button>
                                </div>

                                {inputType === 'url' ? (
                                    <input
                                        type="text"
                                        value={editForm.url || ''}
                                        onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="https://youtube.com/..."
                                    />
                                ) : (
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setEditForm({ ...editForm, url: URL.createObjectURL(file) }); // Mock URL for demo
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                                                <Upload size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Haz clic para subir o arrastra un archivo</p>
                                            <p className="text-xs text-slate-400">PDF, MP4, MP3 (Max 50MB)</p>
                                            {editForm.url && editForm.url.startsWith('blob:') && (
                                                <p className="text-xs font-bold text-green-600 mt-2">Archivo seleccionado listo para subir</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tags (separados por coma)</label>
                                <input
                                    type="text"
                                    value={editForm.tags?.join(', ') || ''}
                                    onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: Liderazgo, Estrategia, Innovación"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => { setShowCreateModal(false); setIsEditing(false); setEditForm({}); }}
                                className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={isEditing ? handleEditResource : handleCreateResource}
                                disabled={!editForm.title || !editForm.type || !editForm.category}
                                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Crear Contenido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Eliminar Contenido</h3>
                                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>

                        <p className="text-slate-600 mb-8">¿Estás seguro de que deseas eliminar este contenido? Se eliminará permanentemente del centro de aprendizaje.</p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteResource(showDeleteConfirm)}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE GESTOR DE METODOLOGÍA (HU 3.1 & 3.2) ---
function MethodologyManager() {
    const [resources, setResources] = React.useState(METHODOLOGY_CONTENT);
    const [selectedResource, setSelectedResource] = React.useState<MethodologyResource | null>(null);
    const [commentText, setCommentText] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("Todos");
    const [selectedType, setSelectedType] = React.useState<string>("Todos");
    const { currentUser, currentRole } = useUser();

    // HU 3.1: Admin mode for Gestor
    const isGestor = currentRole === 'gestor';
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState<Partial<MethodologyResource>>({});
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<number | null>(null);
    const [inputType, setInputType] = React.useState<'link' | 'file' | 'embed'>('link');

    // Filtros
    const categories = ["Todos", "Fundamentos", "Herramientas", "Evaluación", "Programas", "Reportes", "Implementación", "Casos"];
    const types = ["Todos", "pdf", "video", "podcast", "ppt", "html", "scorm"];

    const filteredResources = resources.filter(r => {
        const matchCategory = selectedCategory === "Todos" || r.category === selectedCategory;
        const matchType = selectedType === "Todos" || r.type === selectedType;
        return matchCategory && matchType;
    });

    const getIconForType = (type: string) => {
        switch (type) {
            case 'video': return <Video size={32} />;
            case 'podcast': return <Mic size={32} />;
            case 'ppt': return <Monitor size={32} />;
            case 'html': return <Globe size={32} />;
            case 'scorm': return <Package size={32} />;
            default: return <FileText size={32} />;
        }
    };

    const getColorForType = (type: string) => {
        switch (type) {
            case 'video': return 'bg-red-50 text-red-500';
            case 'podcast': return 'bg-purple-50 text-purple-500';
            case 'ppt': return 'bg-orange-50 text-orange-500';
            case 'html': return 'bg-blue-50 text-blue-500';
            case 'scorm': return 'bg-indigo-50 text-indigo-500';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    const handleLike = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setResources(resources.map(r => {
            if (r.id === id) {
                return { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 };
            }
            return r;
        }));

        // Also update selected if it matches
        if (selectedResource && selectedResource.id === id) {
            const updated = resources.find(r => r.id === id); // Need fresh reference after map? Actually logic above is cleaner if we just toggle
            setSelectedResource(prev => prev ? { ...prev, liked: !prev.liked, likes: !prev.liked ? prev.likes + 1 : prev.likes - 1 } : null);
        }
    };

    const handleAddComment = () => {
        if (!commentText.trim() || !selectedResource) return;

        const newComment: Comment = {
            id: Date.now(),
            author: currentUser?.name || "Usuario",
            avatar: currentUser?.avatar,
            text: commentText,
            date: new Date().toISOString().split('T')[0],
            role: currentUser?.role || 'Mentor'
        };

        const updatedResource = {
            ...selectedResource,
            comments: [...selectedResource.comments, newComment]
        };

        setSelectedResource(updatedResource);
        setResources(resources.map(r => r.id === selectedResource.id ? updatedResource : r));
        setCommentText("");
    };

    // HU 3.1: CRUD Handlers for Gestor
    const handleCreateResource = () => {
        if (!editForm.title || !editForm.type || !editForm.category) return;

        const newResource: MethodologyResource = {
            id: Date.now(),
            title: editForm.title,
            type: editForm.type as any,
            category: editForm.category,
            description: editForm.description || "",
            url: editForm.url || "#",
            embedCode: editForm.embedCode,
            date: new Date().toISOString().split('T')[0],
            author: currentUser?.name || "Gestor",
            likes: 0,
            liked: false,
            tags: editForm.tags || [],
            comments: []
        };

        setResources([newResource, ...resources]);
        setShowCreateModal(false);
        setEditForm({});
        setInputType('link');
    };

    const handleEditResource = () => {
        if (!selectedResource || !editForm.title) return;

        const updatedResource = {
            ...selectedResource,
            ...editForm
        };

        setResources(resources.map(r => r.id === selectedResource.id ? updatedResource : r));
        setSelectedResource(updatedResource);
        setIsEditing(false);
        setEditForm({});
        setInputType('link');
    };

    const handleDeleteResource = (id: number) => {
        setResources(resources.filter(r => r.id !== id));
        setShowDeleteConfirm(null);
        if (selectedResource?.id === id) {
            setSelectedResource(null);
        }
    };

    const handleDeleteComment = (commentId: number) => {
        if (!selectedResource) return;

        const updatedResource = {
            ...selectedResource,
            comments: selectedResource.comments.filter(c => c.id !== commentId)
        };

        setSelectedResource(updatedResource);
        setResources(resources.map(r => r.id === selectedResource.id ? updatedResource : r));
    };

    const startEdit = (resource: MethodologyResource) => {
        setEditForm({
            title: resource.title,
            description: resource.description,
            type: resource.type,
            category: resource.category,
            url: resource.url,
            embedCode: resource.embedCode,
            tags: resource.tags
        });

        if (resource.embedCode) {
            setInputType('embed');
        } else if (resource.url && resource.url.startsWith('blob:')) {
            setInputType('file');
        } else {
            setInputType('link');
        }

        setIsEditing(true);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Metodología 4Shine</h1>
                    <p className="text-slate-500">Recursos y estándares oficiales de Carmenza Alarcón</p>
                </div>

                <div className="flex gap-2 items-center">
                    {isGestor && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-md"
                        >
                            <Plus size={18} /> Crear Recurso
                        </button>
                    )}

                    <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                            <Filter size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">Filtros:</span>
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="text-sm border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="w-px h-6 bg-slate-100 mx-1"></div>
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="text-sm border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer"
                        >
                            {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {filteredResources.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Search size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No se encontraron recursos con los filtros seleccionados.</p>
                    </div>
                )}

                {filteredResources.map(resource => (
                    <div key={resource.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group relative">
                        {/* Gestor Admin Controls */}
                        {isGestor && (
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedResource(resource);
                                        startEdit(resource);
                                    }}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    title="Editar recurso"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(resource.id);
                                    }}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Eliminar recurso"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        <div className={`p-4 rounded-lg shrink-0 ${getColorForType(resource.type)}`} onClick={() => setSelectedResource(resource)}>
                            {getIconForType(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedResource(resource)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase tracking-wider">{resource.category}</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-400 uppercase tracking-wider">{resource.type}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{resource.title}</h3>
                                </div>
                                <button
                                    onClick={(e) => handleLike(e, resource.id)}
                                    className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full transition-colors ${resource.liked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Heart size={16} className={resource.liked ? "fill-current" : ""} />
                                    {resource.likes}
                                </button>
                            </div>
                            <p className="text-slate-600 mt-2 text-sm line-clamp-2">{resource.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Users size={12} /> {resource.author}</span>
                                <span>• {resource.date}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={12} /> {resource.comments.length}</span>
                                <div className="flex gap-1 ml-auto">
                                    {resource.tags?.map(tag => (
                                        <span key={tag} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-400">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Detail */}
            {selectedResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedResource(null)}>
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${getColorForType(selectedResource.type)}`}>
                                    {getIconForType(selectedResource.type)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{selectedResource.title}</h2>
                                    <p className="text-slate-500 text-xs flex gap-2">
                                        <span>{selectedResource.category}</span>
                                        <span>•</span>
                                        <span>{selectedResource.author}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isGestor && (
                                    <button
                                        onClick={() => startEdit(selectedResource)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mr-2"
                                    >
                                        <Edit size={16} />
                                        <span>Editar</span>
                                    </button>
                                )}
                                <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 grid grid-cols-1 lg:grid-cols-3 bg-slate-50">
                            <div className="lg:col-span-2 p-8 overflow-y-auto">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] mb-8 overflow-hidden relative p-0 bg-black">
                                    {selectedResource.embedCode || (selectedResource.url && selectedResource.url !== '#') ? (
                                        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-black">
                                            {selectedResource.embedCode ? (
                                                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-black [&>iframe]:w-full [&>iframe]:h-[600px] [&>iframe]:border-none" dangerouslySetInnerHTML={{ __html: selectedResource.embedCode }} />
                                            ) : selectedResource.type === 'video' ? (
                                                <video controls className="w-full h-full max-h-[600px] object-contain" src={selectedResource.url}>
                                                    Tu navegador no soporta video HTML5.
                                                </video>
                                            ) : selectedResource.url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i) ? (
                                                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedResource.url)}`} className="w-full h-[600px] border-none bg-white" title="Office Viewer" />
                                            ) : selectedResource.type === 'pdf' || selectedResource.type === 'html' || selectedResource.type === 'scorm' ? (
                                                <iframe src={selectedResource.url} className="w-full h-[600px] border-none bg-white" title="Visor de Contenido" />
                                            ) : (['article', 'ppt', 'podcast'].includes(selectedResource.type) || selectedResource.url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                                                selectedResource.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                    <img src={selectedResource.url} alt={selectedResource.title} className="max-w-full max-h-[600px] object-contain" />
                                                ) : (
                                                    <iframe src={selectedResource.url} className="w-full h-[600px] border-none bg-white" />
                                                )
                                            ) : (
                                                <div className="text-white">Formato no soportado para vista previa.</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center p-10 text-center bg-white w-full h-full py-20">
                                            <div className="mb-6 transform hover:scale-110 transition-transform duration-500">
                                                {selectedResource.type === 'video' ? <Video size={80} className="text-slate-300" /> :
                                                    selectedResource.type === 'podcast' ? <Mic size={80} className="text-slate-300" /> :
                                                        selectedResource.type === 'ppt' ? <Monitor size={80} className="text-slate-300" /> :
                                                            selectedResource.type === 'html' ? <Globe size={80} className="text-slate-300" /> :
                                                                selectedResource.type === 'scorm' ? <Package size={80} className="text-slate-300" /> :
                                                                    <FileText size={80} className="text-slate-300" />}
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Visualización no disponible</h3>
                                            <p className="text-slate-500 mb-8 max-w-md">Este recurso no tiene una URL válida configurada ("#"). Por favor contacta al administrador.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-50 pb-2">Descripción del Recurso</h3>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedResource.description}</p>

                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {selectedResource.tags?.map(tag => (
                                                <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                                    <Hash size={12} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={(e) => handleLike(e, selectedResource.id)}
                                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedResource.liked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <Heart size={20} className={selectedResource.liked ? "fill-current" : ""} />
                                            {selectedResource.liked ? 'Te gusta' : 'Me gusta'} ({selectedResource.likes})
                                        </button>
                                        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                            <Share2 size={20} /> Compartir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-white border-l border-slate-100 flex flex-col h-full">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare size={18} /> Comentarios</h3>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full">{selectedResource.comments.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {selectedResource.comments.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                            <MessageCircle size={32} className="mb-2 opacity-50" />
                                            <p className="text-sm italic">Sé el primero en comentar.</p>
                                        </div>
                                    )}
                                    {selectedResource.comments.map(comment => (
                                        <div key={comment.id} className="group">
                                            <div className="flex items-start gap-3 mb-1">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden border border-slate-200">
                                                    {(comment.avatar && comment.avatar.length > 5) ? <img src={comment.avatar} className="w-full h-full object-cover" /> : (comment.avatar || comment.author[0])}
                                                </div>
                                                <div>
                                                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700">
                                                        <span className="font-bold text-xs block mb-1 text-slate-900">{comment.author}</span>
                                                        {comment.text}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 ml-2 mt-1">{comment.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 text-sm border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                            placeholder="Escribe un comentario..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HU 3.1: Create/Edit Resource Modal for Gestor */}
            {(showCreateModal || isEditing) && isGestor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateModal(false); setIsEditing(false); setEditForm({}); setInputType('link'); }}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? 'Editar Recurso' : 'Crear Nuevo Recurso'}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Título *</label>
                                <input
                                    type="text"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: Manual Metodológico 4Shine"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo *</label>
                                    <select
                                        value={editForm.type || ''}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="pdf">PDF</option>
                                        <option value="video">Video</option>
                                        <option value="podcast">Podcast</option>
                                        <option value="ppt">Presentación</option>
                                        <option value="html">HTML</option>
                                        <option value="scorm">SCORM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Categoría *</label>
                                    <select
                                        value={editForm.category || ''}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value as any })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {categories.filter(c => c !== 'Todos').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                                <textarea
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    rows={3}
                                    placeholder="Describe brevemente el recurso..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fuente del Contenido</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'link' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => { setInputType('link'); setEditForm({ ...editForm, embedCode: undefined }); }}
                                    >
                                        Enlace / Video
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => { setInputType('file'); setEditForm({ ...editForm, embedCode: undefined }); }}
                                    >
                                        Subir Archivo
                                    </button>
                                    <button
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'embed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => { setInputType('embed'); setEditForm({ ...editForm, url: undefined }); }}
                                    >
                                        Código Embed
                                    </button>
                                </div>

                                {inputType === 'embed' ? (
                                    <textarea
                                        value={editForm.embedCode || ''}
                                        onChange={e => setEditForm({ ...editForm, embedCode: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
                                        rows={4}
                                        placeholder="<iframe src='...'></iframe>"
                                    />
                                ) : inputType === 'file' ? (
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setEditForm({ ...editForm, url: URL.createObjectURL(file) });
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                                                <Upload size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Haz clic para subir o arrastra un archivo</p>
                                            <p className="text-xs text-slate-400">PDF, MP4, MP3, Office (Max 50MB)</p>
                                            {editForm.url && editForm.url.startsWith('blob:') && (
                                                <p className="text-xs font-bold text-green-600 mt-2">Archivo seleccionado listo</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={editForm.url || ''}
                                        onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="https://youtube.com/... o https://..."
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tags (separados por coma)</label>
                                <input
                                    type="text"
                                    value={editForm.tags?.join(', ') || ''}
                                    onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ej: Guía, Procesos, Sesiones"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => { setShowCreateModal(false); setIsEditing(false); setEditForm({}); }}
                                className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={isEditing ? handleEditResource : handleCreateResource}
                                disabled={!editForm.title || !editForm.type || !editForm.category}
                                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Crear Recurso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Eliminar Recurso</h3>
                                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>

                        <p className="text-slate-600 mb-8">¿Estás seguro de que deseas eliminar este recurso? Se eliminará permanentemente de la metodología.</p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteResource(showDeleteConfirm)}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE GESTOR DE TRAYECTORIAS (HU 4.1) ---
// --- COMPONENTE GESTOR DE TRAYECTORIAS (HU 4.1) ---
function MenteeTrajectoriesManager() {
    const [mentees, setMentees] = React.useState(MENTEES);
    const [selectedMenteeId, setSelectedMenteeId] = React.useState<number | null>(null);
    const [filters, setFilters] = React.useState({
        search: "",
        plan: "Todos",
        seniority: "Todos",
        location: "Todos",
        industry: "Todos"
    });

    const uniqueLocations = Array.from(new Set(MENTEES.map(m => m.location))).sort();
    const uniqueIndustries = Array.from(new Set(MENTEES.map(m => m.industry))).sort();

    const filteredMentees = mentees.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            m.email.toLowerCase().includes(filters.search.toLowerCase());
        const matchPlan = filters.plan === "Todos" || m.planType === filters.plan;
        const matchSeniority = filters.seniority === "Todos" || m.seniority === filters.seniority;
        const matchLocation = filters.location === "Todos" || m.location === filters.location;
        const matchIndustry = filters.industry === "Todos" || m.industry === filters.industry;

        return matchSearch && matchPlan && matchSeniority && matchLocation && matchIndustry;
    });

    // HU 4.3: Generación de Informes - Export to CSV
    const handleExport = () => {
        const headers = ['Nombre', 'Email', 'Empresa', 'Plan', 'Seniority', 'Ubicación', 'Industria', 'Progreso (%)', 'Estado', 'Próxima Sesión'];

        const rows = filteredMentees.map(m => [
            m.name,
            m.email,
            m.company,
            m.planType,
            m.seniority,
            m.location,
            m.industry,
            m.progress.toString(),
            m.status === 'good' ? 'Bueno' : m.status === 'warning' ? 'Atención' : 'Crítico',
            m.nextSession
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `trayectorias_lideres_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (selectedMenteeId) {
        return <MenteeDetailView menteeId={selectedMenteeId} onBack={() => setSelectedMenteeId(null)} />;
    }

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Trayectorias de Líderes</h1>
                    <p className="text-slate-500">Visualiza y gestiona el progreso de todos los líderes asignados.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
                    >
                        <LogOut size={16} className="rotate-90" /> Exportar
                    </button>
                    <button className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 shadow-md shadow-amber-200">
                        <Plus size={16} /> Nuevo Líder
                    </button>
                </div>
            </header>

            {/* HU 4.1: Monitor de Progreso Global - KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Users size={24} className="opacity-80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">Total</span>
                    </div>
                    <p className="text-3xl font-bold">{mentees.length}</p>
                    <p className="text-sm opacity-90">Líderes Activos</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Target size={24} className="opacity-80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">Promedio</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {Math.round(filteredMentees.reduce((acc, m) => acc + m.progress, 0) / (filteredMentees.length || 1))}%
                    </p>
                    <p className="text-sm opacity-90">Progreso General</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Award size={24} className="opacity-80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">Estado</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {filteredMentees.filter(m => m.status === 'good').length}
                    </p>
                    <p className="text-sm opacity-90">En Buen Estado</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Zap size={24} className="opacity-80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">Planes</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {filteredMentees.filter(m => m.planType === 'VIP' || m.planType === 'Empresa Élite').length}
                    </p>
                    <p className="text-sm opacity-90">VIP / Élite</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <select
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-600"
                    value={filters.plan}
                    onChange={e => setFilters({ ...filters, plan: e.target.value })}
                >
                    <option value="Todos">Plan: Todos</option>
                    <option value="VIP">VIP</option>
                    <option value="Premium">Premium</option>
                    <option value="Empresa Élite">Empresa Élite</option>
                    <option value="Standard">Standard</option>
                </select>
                <select
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-600"
                    value={filters.seniority}
                    onChange={e => setFilters({ ...filters, seniority: e.target.value })}
                >
                    <option value="Todos">Seniority: Todos</option>
                    <option value="C-Level">C-Level</option>
                    <option value="VP">VP</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Senior">Senior</option>
                </select>
                <select
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-600"
                    value={filters.location}
                    onChange={e => setFilters({ ...filters, location: e.target.value })}
                >
                    <option value="Todos">Ubicación: Todas</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-600"
                    value={filters.industry}
                    onChange={e => setFilters({ ...filters, industry: e.target.value })}
                >
                    <option value="Todos">Industria: Todas</option>
                    {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                <th className="p-4">Líder / Empresa</th>
                                <th className="p-4">Plan / Seniority</th>
                                <th className="p-4">Ubicación / Industria</th>
                                <th className="p-4 text-center">Progreso</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMentees.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">No se encontraron líderes que coincidan con los filtros.</td>
                                </tr>
                            )}
                            {filteredMentees.map(mentee => (
                                <tr key={mentee.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                                {mentee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{mentee.name}</p>
                                                <p className="text-xs text-slate-500">{mentee.company}</p>
                                                <p className="text-[10px] text-slate-400">{mentee.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${mentee.planType === 'VIP' ? 'bg-amber-100 text-amber-700' :
                                                mentee.planType === 'Empresa Élite' ? 'bg-indigo-100 text-indigo-700' :
                                                    mentee.planType === 'Premium' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {mentee.planType}
                                            </span>
                                            <span className="text-xs text-slate-600 font-medium">{mentee.seniority}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs text-slate-600">
                                            <div className="flex items-center gap-1 mb-1"><MapPin size={12} className="text-slate-400" /> {mentee.location}</div>
                                            <div className="flex items-center gap-1"><Briefcase size={12} className="text-slate-400" /> {mentee.industry}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="w-full max-w-[100px] mx-auto">
                                            <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500">
                                                <span>{mentee.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${mentee.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${mentee.status === 'good' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            mentee.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {mentee.status === 'good' ? 'Al día' : mentee.status === 'warning' ? 'Riesgo' : 'Crítico'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedMenteeId(mentee.id)}
                                            className="text-slate-400 hover:text-amber-500 transition-colors p-2 rounded-full hover:bg-amber-50"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
                    <span>Mostrando {filteredMentees.length} de {mentees.length} líderes</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE GESTOR DE PERFIL (Para manejo de estado local) ---
function ProfileManager({ user }: { user: any }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const { currentRole, updateUser } = useUser();
    const bannerRef = React.useRef<HTMLInputElement>(null);
    const avatarRef = React.useRef<HTMLInputElement>(null);

    // Local state for basic fields simulation
    const [formData, setFormData] = React.useState({
        name: user.name,
        company: user.company,
        role: user.profession || user.role, // Use profession if available
        location: user.location,
        bio: user.bio || "Agrega una breve biografía profesional...",
        industry: user.industry || "",
        linkedin: user.socialLinks?.linkedin || "",
        website: user.socialLinks?.website || "",
        banner: "", // New field for banner image
        avatar: user.avatar // Copy initial avatar
    });

    const [projects, setProjects] = React.useState(user.projects || []);

    const handleSave = () => {
        // Prepare updates
        const updates: any = {
            ...formData,
            projects: projects
        };

        // Update context (Mock API call)
        updateUser(updates);

        setIsEditing(false);
        alert("Cambios guardados con éxito (Simulación)");
    };

    const handleAddProject = () => {
        const newProject = {
            id: Date.now(),
            title: "Nuevo Proyecto",
            role: "Rol desempeñado",
            description: "Descripción del proyecto..."
        };
        setProjects([...projects, newProject]);
    };

    const handleDeleteProject = (id: number) => {
        setProjects(projects.filter((p: any) => p.id !== id));
    };

    const handleUpdateProject = (id: number, field: string, value: string) => {
        setProjects(projects.map((p: any) => p.id === id ? { ...p, [field]: value } : p));
    };

    // Trigger Hidden File Input
    const triggerFileInput = (type: 'banner' | 'avatar') => {
        if (type === 'banner' && bannerRef.current) bannerRef.current.click();
        if (type === 'avatar' && avatarRef.current) avatarRef.current.click();
    };

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'avatar') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [type]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <input type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
            <input type="file" ref={avatarRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
            {/* Header / Banner Profile */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 group/banner">
                {/* Banner Area */}
                <div
                    className={`h-48 relative bg-cover bg-center transition-all ${!formData.banner ? 'bg-gradient-to-r from-gray-900 to-neutral-800' : ''}`}
                    style={formData.banner ? { backgroundImage: `url(${formData.banner})` } : {}}
                >
                    {!formData.banner && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600/30 font-bold text-4xl uppercase tracking-widest pointer-events-none">
                            Tu Portada
                        </div>
                    )}

                    {/* Plan Badge (Optional: kept but unobtrusive) */}
                    <span className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/10">
                        <Award size={10} /> {user.planType || 'Plan Estándar'}
                    </span>

                    {/* Edit Banner Button */}
                    {isEditing && (
                        <button
                            onClick={() => triggerFileInput('banner')}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 backdrop-blur-sm transition-all shadow-lg border border-white/20"
                        >
                            <Camera size={20} /> Cambiar Portada
                        </button>
                    )}
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-end -mt-16 mb-6 gap-6 relative z-10">
                        {/* Avatar Area */}
                        <div className="relative group/avatar">
                            <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl shadow-2xl border-4 border-white overflow-hidden ${(!formData.avatar || formData.avatar.length < 5) ? user.color : 'bg-white'} text-white font-bold`}>
                                {formData.avatar && formData.avatar.length > 5 ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    formData.avatar || user.name.charAt(0)
                                )}
                            </div>

                            {/* Edit Avatar Button */}
                            {isEditing && (
                                <button
                                    onClick={() => triggerFileInput('avatar')}
                                    className="absolute inset-0 bg-black/50 hover:bg-black/60 text-white flex flex-col items-center justify-center gap-1 rounded-2xl font-bold text-xs opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]"
                                >
                                    <Camera size={24} />
                                    <span>Cambiar</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 pb-2 pt-2">
                            <h2 className="text-3xl font-bold text-slate-800">{formData.name}</h2>
                            <p className="text-slate-500 flex items-center gap-2 mb-2">
                                <span className="font-semibold text-slate-700">{formData.role}</span> en {formData.company}
                            </p>
                            {/* Social Links Display */}
                            <div className="flex gap-3">
                                {formData.linkedin && (
                                    <a href={`https://${formData.linkedin}`} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 transition">
                                        <Linkedin size={16} />
                                    </a>
                                )}
                                {formData.website && (
                                    <a href={`https://${formData.website}`} target="_blank" rel="noopener noreferrer" className="bg-slate-50 text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                                        <Link size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="pb-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {isEditing ? <><Check size={16} /> Guardar Cambios</> : <><Edit2 size={16} /> Editar Perfil</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Personal Info & Bio */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Bio */}
                            <div className="relative group">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><PenTool size={16} className="text-amber-500" /> Acerca de mí</h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-600 text-sm leading-relaxed"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                                        "{formData.bio}"
                                    </p>
                                )}
                            </div>

                            {/* Basic Data Form */}
                            {isEditing && (
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in">
                                    <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Información Pública</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Ubicación</label>
                                            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Cargo / Profesión</label>
                                            <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Empresa</label>
                                            <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full p-2 border rounded-md text-sm" />
                                        </div>
                                        {/* HU 2.1 Extended Fields */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Industria / Sector</label>
                                            <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full p-2 border rounded-md text-sm" placeholder="Ej. FinTech, Salud..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-2 mt-2">Redes Sociales (Visible para estudiantes)</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Linkedin size={16} className="text-slate-400" />
                                                    <input type="text" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="flex-1 p-2 border rounded-md text-sm" placeholder="URL LinkedIn" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link size={16} className="text-slate-400" />
                                                    <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="flex-1 p-2 border rounded-md text-sm" placeholder="Sitio Web Personal" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Projects Portfolio (HU 2.2) */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={16} className="text-amber-500" /> Proyectos Destacados</h3>
                                    {isEditing && (
                                        <button onClick={handleAddProject} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition font-bold flex items-center gap-1">
                                            <Plus size={14} /> Añadir Proyecto
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {projects.length > 0 ? projects.map((p: any) => (
                                        <div key={p.id || Math.random()} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group/project">
                                            {isEditing && (
                                                <button onClick={() => handleDeleteProject(p.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                            {isEditing ? (
                                                <div className="space-y-2 pr-8">
                                                    <input
                                                        type="text"
                                                        value={p.title}
                                                        onChange={(e) => handleUpdateProject(p.id, 'title', e.target.value)}
                                                        className="w-full font-bold text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-amber-500 focus:outline-none bg-transparent"
                                                        placeholder="Título del Proyecto"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={p.role}
                                                        onChange={(e) => handleUpdateProject(p.id, 'role', e.target.value)}
                                                        className="w-full text-xs font-bold uppercase text-slate-500 border-b border-transparent hover:border-slate-200 focus:border-amber-500 focus:outline-none bg-transparent"
                                                        placeholder="Tu Rol"
                                                    />
                                                    <textarea
                                                        value={p.description}
                                                        onChange={(e) => handleUpdateProject(p.id, 'description', e.target.value)}
                                                        className="w-full text-sm text-slate-500 border rounded p-1 hover:border-slate-200 focus:border-amber-500 focus:outline-none bg-transparent"
                                                        rows={2}
                                                        placeholder="Descripción breve..."
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-800">{p.title}</h4>
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{p.role}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-2">{p.description}</p>
                                                </>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <p className="text-slate-400 text-sm">No has añadido proyectos aún.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Sidebar Stats & Social */}
                        <div className="space-y-6">
                            {/* Stats Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider">Tu Impacto</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span className="text-sm text-slate-500">Tests Completados</span>
                                        <span className="font-bold text-slate-800">{user.stats?.tests || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span className="text-sm text-slate-500">Conexiones</span>
                                        <span className="font-bold text-slate-800">{user.stats?.connections || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <span className="text-sm text-slate-500">Progreso General</span>
                                        <span className="font-bold text-amber-600">{user.stats?.progress || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider">Redes y Contacto</h3>
                                <div className="space-y-3">
                                    {user.socialLinks?.linkedin && (
                                        <a href={`https://${user.socialLinks.linkedin}`} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition text-sm text-slate-600 group">
                                            <div className="bg-blue-100 p-1.5 rounded-md text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Link size={14} /></div>
                                            <span className="truncate">{user.socialLinks.linkedin}</span>
                                        </a>
                                    )}
                                    {user.socialLinks?.twitter && (
                                        <a href={`https://twitter.com/${user.socialLinks.twitter.replace('@', '')}`} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition text-sm text-slate-600 group">
                                            <div className="bg-sky-100 p-1.5 rounded-md text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors"><Globe size={14} /></div>
                                            <span className="truncate">{user.socialLinks.twitter}</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Interests */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider">Intereses</h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.interests ? user.interests.map((tag: string) => (
                                        <span key={tag} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                                            {tag}
                                        </span>
                                    )) : <span className="text-slate-400 text-xs">Sin intereses definidos</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- NEWS VIEWER MODAL COMPONENT ---
function NewsViewer({ news, onClose }: { news: NewsUpdate, onClose: () => void }) {
    const [likes, setLikes] = React.useState(news.likes || 12);
    const [liked, setLiked] = React.useState(false);
    const [commentText, setCommentText] = React.useState('');
    const [localComments, setLocalComments] = React.useState([
        { id: 1, user: "Juan Perez", text: "Excelente noticia, vamos con todo.", time: "Hace 1 hora" }
    ]);

    const handleLike = () => {
        if (liked) {
            setLikes(likes - 1);
            setLiked(false);
        } else {
            setLikes(likes + 1);
            setLiked(true);
        }
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setLocalComments([...localComments, { id: Date.now(), user: "Yo", text: commentText, time: "Justo ahora" }]);
        setCommentText('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 p-2 rounded-full transition"
                >
                    <X size={20} />
                </button>

                <div className={`h-32 ${news.image} flex items-center justify-center`}>
                    <span className="text-4xl font-bold text-white opacity-20 uppercase tracking-widest">{news.category}</span>
                </div>

                <div className="p-8 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{news.category}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> {news.date}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{news.title}</h2>
                    <p className="text-slate-600 leading-relaxed mb-8 text-lg">{news.summary} {news.summary} (Contenido extendido simulado para demostración de lectura).</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 py-4 border-t border-b border-slate-100 mb-6">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${liked ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Heart size={18} fill={liked ? "currentColor" : "none"} /> {likes} Me gusta
                        </button>
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                            <MessageSquare size={18} /> {localComments.length} Comentarios
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-4">Comentarios</h4>
                        <div className="space-y-4 mb-6">
                            {localComments.map(c => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                                        {c.user.charAt(0)}
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl flex-1">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-bold text-slate-800 text-sm">{c.user}</span>
                                            <span className="text-[10px] text-slate-400">{c.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddComment} className="relative">
                            <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- NEWS VIEWER COMPONENT END ---

// --- VIEWER MODAL COMPONENT ---
function LearningViewer({ item, onClose }: { item: LearningItem, onClose: () => void }) {
    const [commentText, setCommentText] = React.useState('');
    const [localComments, setLocalComments] = React.useState([
        { id: 101, user: "Ana Torres", text: "¡Gran material! Muy útil para mi equipo.", time: "Hace 2 días" },
        { id: 102, user: "Carlos D.", text: "Me encantó la sección de feedback.", time: "Hace 5 horas" }
    ]);

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setLocalComments([...localComments, { id: Date.now(), user: "Yo", text: commentText, time: "Justo ahora" }]);
        setCommentText('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                    <X size={20} />
                </button>

                {/* Left: Content Viewer */}
                <div className="flex-1 bg-black flex items-center justify-center relative">
                    {item.type === 'video' ? (
                        <video src={item.url} controls className="max-w-full max-h-full" autoPlay />
                    ) : item.type === 'pdf' ? (
                        <iframe src={item.url} className="w-full h-full" title={item.title} />
                    ) : (
                        <div className="text-white text-center">
                            <p className="text-xl font-bold mb-4">Contenido Externo / No soportado</p>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600 transition">
                                Abrir en nueva pestaña
                            </a>
                        </div>
                    )}
                </div>

                {/* Right: Sidebar (Info & Comments) */}
                <div className="w-96 bg-white border-l border-slate-100 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2 inline-block">{item.category}</span>
                        <h2 className="font-bold text-xl text-slate-800 leading-tight mb-2">{item.title}</h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock size={12} /> {item.duration}</span>
                            <span className="flex items-center gap-1"><Heart size={12} className="text-red-500" /> {item.likes} Likes</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="font-bold text-sm text-slate-700 mb-4 uppercase tracking-wider">Comentarios ({localComments.length})</h3>
                        <div className="space-y-4 mb-6">
                            {localComments.map(c => (
                                <div key={c.id} className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-700 text-sm">{c.user}</span>
                                        <span className="text-[10px] text-slate-400">{c.time}</span>
                                    </div>
                                    <p className="text-slate-600">{c.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE GESTOR DE APRENDIZAJE (Para búsquedas y filtros locales) ---
// --- COMPONENTE MÓDULO DE APRENDIZAJE (LÍDERES) ---
function LearningModule() {
    const { currentUser } = useUser();
    const [courses, setCourses] = React.useState(LEADER_TRAINING);
    const [activeCourseId, setActiveCourseId] = React.useState<number | null>(null);
    const [scormModule, setScormModule] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<'modules' | 'comments'>('modules');
    const [commentText, setCommentText] = React.useState('');

    // Search and Filter States
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showOnlyLiked, setShowOnlyLiked] = React.useState(false);
    const [showRecommendedOnly, setShowRecommendedOnly] = React.useState(true);
    const [selectedCategory, setSelectedCategory] = React.useState<string>("Todos");

    // Filtros
    const categories = ["Todos", "Liderazgo", "Gestión", "Habilidades Blandas", "Comunicación", "Estrategia", "Productividad", "Innovación", "Cultura", "Finanzas", "Marketing", "Gestión del Cambio", "Ética", "Bienestar", "Inclusión", "Tecnología", "Mentoring", "Desarrollo"];

    const filteredCourses = courses.filter(r => {
        const matchCategory = selectedCategory === "Todos" || r.category === selectedCategory;
        const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchLiked = !showOnlyLiked || r.liked;
        const matchRecommended = !showRecommendedOnly || r.isRecommended;

        return matchCategory && matchSearch && matchLiked && matchRecommended;
    });

    const activeCourse = React.useMemo(() =>
        courses.find(c => c.id === activeCourseId) || null
        , [courses, activeCourseId]);

    // Mock modules for the SCORM player demo
    const modules = [
        { title: "Bienvenida e Introducción", duration: "5 min", type: "video" },
        { title: "Conceptos Clave del Liderazgo", duration: "12 min", type: "text" },
        { title: "Ejercicio de Reflexión", duration: "10 min", type: "interactive" },
        { title: "Evaluación Final del Módulo", duration: "15 min", type: "quiz" }
    ];

    const handleLike = (e: React.MouseEvent, courseId: number) => {
        e.stopPropagation();
        setCourses(prevCourses => prevCourses.map(c => {
            if (c.id === courseId) {
                return {
                    ...c,
                    liked: !c.liked,
                    likes: c.liked ? c.likes - 1 : c.likes + 1
                };
            }
            return c;
        }));
    };

    const handleAddComment = () => {
        if (!commentText.trim() || !activeCourseId) return;

        const newCommentObj: Comment = {
            id: Date.now(),
            author: currentUser?.name || "Líder",
            text: commentText,
            date: new Date().toISOString().split('T')[0],
            role: "Lider", // Use 'Lider' or currentRole if preferred
            avatar: currentUser?.avatar || "L"
        };

        setCourses(prevCourses => prevCourses.map(c => {
            if (c.id === activeCourseId) {
                return {
                    ...c,
                    commentsArray: [newCommentObj, ...(c.commentsArray || [])]
                };
            }
            return c;
        }));

        setCommentText('');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Programa de Liderazgo</h2>
                        <p className="text-slate-500">Desarrolla tus habilidades directivas con nuestros cursos interactivos.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar cursos, temas..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
                            className={clsx("p-2 rounded-md transition-all", showRecommendedOnly ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                            title="Ver Recomendados"
                        >
                            <Sparkles size={20} className={showRecommendedOnly ? "fill-current" : ""} />
                        </button>
                        <button
                            onClick={() => setShowOnlyLiked(!showOnlyLiked)}
                            className={clsx("p-2 rounded-md transition-all", showOnlyLiked ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                            title="Mis Favoritos"
                        >
                            <Heart size={20} className={showOnlyLiked ? "fill-current" : ""} />
                        </button>
                    </div>
                    <select
                        className="px-4 py-2 bg-slate-100 border-none rounded-lg text-slate-600 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer flex flex-col h-full">
                        <div className="bg-slate-900 h-32 relative overflow-hidden flex items-center justify-center shrink-0">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Package size={32} />
                            </div>
                            <span className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                SCORM
                            </span>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">{course.category}</div>
                                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                    <Heart size={14} className={course.liked ? "fill-pink-500 text-pink-500" : ""} />
                                    {course.likes}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">{course.title}</h3>

                            <div className="mt-auto space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                        <span>Progreso</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                                    {course.commentsArray?.length > 0 && (
                                        <span className="flex items-center gap-1"><MessageCircle size={14} /> {course.commentsArray.length}</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setActiveCourseId(course.id); setActiveTab('modules'); }}
                                    className={clsx(
                                        "w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                        course.progress === 100
                                            ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                                            : "border border-amber-100 text-amber-600 hover:bg-amber-50"
                                    )}
                                >
                                    <Monitor size={18} />
                                    {course.progress === 0 ? "Iniciar Curso" : course.progress === 100 ? "Repasar Curso" : "Continuar Curso"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SCORM Player Modal */}
            {activeCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full h-full md:w-[95vw] md:h-[90vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-scale-up">
                        {/* Player Sidebar */}
                        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-200 bg-white">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{activeCourse.title}</h3>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${activeCourse.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{activeCourse.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleLike(e, activeCourse.id)}
                                        className={clsx(
                                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors",
                                            activeCourse.liked ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        <Heart size={14} className={activeCourse.liked ? "fill-pink-500" : ""} />
                                        {activeCourse.likes}
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar Tabs */}
                            <div className="flex border-b border-slate-200 bg-white">
                                <button
                                    onClick={() => setActiveTab('modules')}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2",
                                        activeTab === 'modules' ? "border-amber-600 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Temario
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2",
                                        activeTab === 'comments' ? "border-amber-600 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Discusión
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50">
                                {activeTab === 'modules' ? (
                                    <div className="p-2 space-y-1">
                                        {modules.map((mod, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setScormModule(idx)}
                                                className={clsx(
                                                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all text-sm",
                                                    scormModule === idx ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500" : "text-slate-500 hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                                    scormModule === idx ? "bg-amber-200 text-amber-700" : "bg-slate-200 text-slate-500"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="truncate">{mod.title}</div>
                                                    <div className="text-[10px] opacity-70 flex items-center gap-1">
                                                        {mod.type === 'video' ? <Video size={10} /> : mod.type === 'quiz' ? <ClipboardCheck size={10} /> : <FileText size={10} />}
                                                        {mod.duration}
                                                    </div>
                                                </div>
                                                {idx < scormModule && <Check size={14} className="text-green-500" />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 p-4 space-y-4">
                                            {activeCourse.commentsArray && activeCourse.commentsArray.length > 0 ? (
                                                activeCourse.commentsArray.map((comment: Comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                            {comment.avatar || comment.author[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-white p-3 rounded-tl-none rounded-2xl shadow-sm text-sm text-slate-600">
                                                                <span className="block font-bold text-slate-800 text-xs mb-1">{comment.author} <span className="text-slate-400 font-normal">• {comment.role}</span></span>
                                                                {comment.text}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1 pl-2">{comment.date}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-slate-400">
                                                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-xs">Aún no hay comentarios. ¡Sé el primero!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'comments' && (
                                <div className="p-3 border-t border-slate-200 bg-white">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Escribe un comentario..."
                                            className="w-full pl-4 pr-10 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="absolute right-1 top-1 p-1 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-600 transition"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'modules' && (
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <button onClick={() => setActiveCourseId(null)} className="w-full py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 font-bold text-sm">
                                        Salir del Curso
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Player Content */}
                        <div className="flex-1 flex flex-col bg-slate-900 relative">
                            <button onClick={() => setActiveCourseId(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition md:hidden">
                                <X size={20} />
                            </button>

                            <div className="flex-1 flex items-center justify-center p-8 bg-black">
                                <div className="max-w-4xl w-full aspect-video bg-slate-800 rounded-xl shadow-2xl flex items-center justify-center flex-col gap-4 text-slate-400 border border-slate-700 relative overflow-hidden group">
                                    {modules[scormModule].type === 'video' ? (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform cursor-pointer border border-white/20">
                                                <div className="ml-1 text-white"><Package size={40} /></div>
                                                <span className="sr-only">Play</span>
                                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                                            </div>
                                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                                <h2 className="text-2xl font-bold mb-2">{modules[scormModule].title}</h2>
                                                <p className="text-slate-300 line-clamp-2">En este módulo aprenderemos los conceptos fundamentales de liderazgo adaptativo.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-8">
                                            <div className="inline-block p-4 rounded-full bg-slate-700/50 mb-4 text-amber-400">
                                                {modules[scormModule].type === 'quiz' ? <ClipboardCheck size={48} /> : <FileText size={48} />}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Contenido Interactivo</h3>
                                            <p className="text-slate-400 max-w-md mx-auto">Este es un componente de demostración SCORM. En una implementación real, aquí se cargaría el paquete interactivo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="h-16 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-6 shrink-0">
                                <button
                                    onClick={() => setScormModule(Math.max(0, scormModule - 1))}
                                    disabled={scormModule === 0}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition"
                                >
                                    <div className="p-1 rounded-full border border-current"><ArrowRight size={14} className="rotate-180" /></div> Anterior
                                </button>

                                <span className="text-slate-400 text-sm font-medium">
                                    Módulo {scormModule + 1} de {modules.length}
                                </span>

                                <button
                                    onClick={() => setScormModule(Math.min(modules.length - 1, scormModule + 1))}
                                    disabled={scormModule === modules.length - 1}
                                    className="flex items-center gap-2 text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-bold shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:bg-slate-700 disabled:shadow-none transition"
                                >
                                    Siguiente <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeedItem({ title, desc, time, type }: any) {
    let icon, colorClass;
    switch (type) {
        case 'content': icon = <Rocket size={16} />; colorClass = "bg-amber-100 text-amber-600"; break;
        case 'social': icon = <Users size={16} />; colorClass = "bg-blue-100 text-blue-600"; break;
        case 'system': icon = <Server size={16} />; colorClass = "bg-slate-200 text-slate-600"; break;
        default: icon = <Star size={16} />; colorClass = "bg-gray-100 text-gray-600";
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm flex gap-4 border border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer">
            <div className="flex-shrink-0 pt-1">
                <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start w-full mb-1">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">{title}</h4>
                    <span className="text-[10px] text-slate-400 ml-4 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">{time}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

// --- COMPONENTE GESTOR DE MENTORÍAS (ROL MENTOR) ---
function MentorSessionsManager() {
    const [sessions, setSessions] = React.useState<MentorshipSession[]>(MENTORSHIPS);
    const [activeTab, setActiveTab] = React.useState<'agenda' | 'requests' | 'history' | 'availability'>('agenda');
    const [selectedSession, setSelectedSession] = React.useState<MentorshipSession | null>(null);
    const [showNoteModal, setShowNoteModal] = React.useState(false);
    const [noteText, setNoteText] = React.useState("");

    // Availability Mock
    const [availability, setAvailability] = React.useState([
        { id: 1, day: "Lunes", time: "09:00 - 11:00", active: true },
        { id: 2, day: "Miércoles", time: "14:00 - 16:00", active: true },
        { id: 3, day: "Viernes", time: "10:00 - 12:00", active: false },
    ]);

    const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
    const pendingSessions = sessions.filter(s => s.status === 'pending_approval');
    const historySessions = sessions.filter(s => s.status === 'completed');

    const handleAccept = (id: number) => {
        setSessions(sessions.map(s => s.id === id ? { ...s, status: 'scheduled', link: "https://zoom.us/j/generado" } : s));
    };

    const handleReject = (id: number) => {
        setSessions(sessions.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    };

    const handleSaveNote = () => {
        if (selectedSession && noteText) {
            setSessions(sessions.map(s => s.id === selectedSession.id ? { ...s, privateNotes: noteText } : s));
            setShowNoteModal(false);
            setNoteText("");
            setSelectedSession(null);
        }
    };

    const openNoteModal = (session: MentorshipSession) => {
        setSelectedSession(session);
        setNoteText(session.privateNotes || "");
        setShowNoteModal(true);
    };

    const toggleAvailability = (id: number) => {
        setAvailability(availability.map(slot => slot.id === id ? { ...slot, active: !slot.active } : slot));
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Mentorías</h2>
                <p className="text-slate-500">Administra tu agenda, solicitudes y bitácora de sesiones.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('agenda')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'agenda' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar size={18} /> Mi Agenda
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'requests' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <UserPlus size={18} /> Solicitudes
                    {pendingSessions.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingSessions.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('availability')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'availability' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock size={18} /> Disponibilidad
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Book size={18} /> Historial & Bitácora
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                {activeTab === 'agenda' && (
                    <div className="p-6">
                        {upcomingSessions.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">No tienes sesiones programadas próximamente.</div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingSessions.map(session => (
                                    <div key={session.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all">
                                        <div className="bg-amber-50 text-amber-600 p-4 rounded-xl flex flex-col items-center min-w-[100px]">
                                            <span className="text-2xl font-bold">{session.date.split('-')[2] || "15"}</span> {/* Simple date parse mock */}
                                            <span className="text-xs uppercase font-bold">ABR</span>
                                            <span className="text-xs mt-1">{session.time}</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${session.type === 'grupal' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {session.type}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg">{session.title}</h3>
                                            <p className="text-slate-500 text-sm flex items-center justify-center md:justify-start gap-2">
                                                <Users size={14} /> Con: <span className="font-semibold">{session.mentee || "Grupo"}</span>
                                            </p>

                                            {session.type === 'grupal' && session.participants && (
                                                <div className="flex -space-x-2 mt-2 justify-center md:justify-start">
                                                    {session.participants.map((p, i) => (
                                                        <div key={i} title={p.name} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                            {p.avatar}
                                                        </div>
                                                    ))}
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+</div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <a href={session.link || "#"} target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center gap-2">
                                                <Video size={18} /> Iniciar Sesión
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="p-6 space-y-4">
                        {pendingSessions.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">No tienes solicitudes pendientes.</div>
                        ) : (
                            pendingSessions.map(session => (
                                <div key={session.id} className="flex flex-col md:flex-row items-center justify-between p-6 border border-slate-100 rounded-xl bg-slate-50/50">
                                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-500 font-bold border border-slate-100">
                                            {session.mentee?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{session.mentee}</h4>
                                            <p className="text-sm text-slate-500">Solicita: {session.title}</p>
                                            <div className="flex gap-2 mt-1 text-xs text-slate-400 font-mono">
                                                <span>{session.date}</span> • <span>{session.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleReject(session.id)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-white hover:text-red-500 font-bold text-sm transition-colors">Rechazar</button>
                                        <button onClick={() => handleAccept(session.id)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold text-sm transition-colors shadow-md">Confirmar</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'availability' && (
                    <div className="p-8">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 mb-8">
                            <Clock className="text-amber-600 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-amber-800">Gestiona tu Disponibilidad</h4>
                                <p className="text-amber-700/80 text-sm">Define los bloques horarios en los que los líderes pueden agendar sesiones contigo. Los cambios se reflejarán inmediatamente.</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            {availability.map(slot => (
                                <div key={slot.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${slot.active ? 'bg-white border-green-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${slot.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <span className="font-bold text-slate-700 w-24">{slot.day}</span>
                                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{slot.time}</span>
                                    </div>
                                    <button
                                        onClick={() => toggleAvailability(slot.id)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${slot.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    >
                                        {slot.active ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            ))}
                            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center gap-2">
                                <Plus size={20} /> Agregar Bloque Horario
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Líder / Grupo</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3 text-center">Rating</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {historySessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50">
                                            <td className="p-3 text-sm text-slate-600 font-mono">{session.date}</td>
                                            <td className="p-3 font-bold text-slate-700">{session.mentee || "Grupo"}</td>
                                            <td className="p-3 text-sm text-slate-500 capitalize">{session.type}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-0.5 text-amber-400">
                                                    <Star size={14} fill="currentColor" />
                                                    <span className="text-slate-600 font-bold ml-1">{session.rating || "-"}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => openNoteModal(session)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto ${session.privateNotes ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    <FileText size={14} /> {session.privateNotes ? 'Ver Bitácora' : 'Crear Bitácora'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNoteModal(false)}>
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Bitácora de Sesión</h3>
                        <p className="text-slate-500 text-sm mb-4">Notas privadas sobre el progreso de <span className="font-bold">{selectedSession?.mentee || "el grupo"}</span>.</p>
                        <textarea
                            className="w-full h-40 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
                            placeholder="Escribe tus observaciones, compromisos y próximos pasos..."
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveNote} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Guardar Notas</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE GESTOR DE MENTORÍAS ---

// --- COMPONENTE GESTOR DE MENTORÍAS (HU 6.1 & 6.2) ---
function GestorMentorshipManager() {
    const [sessions, setSessions] = React.useState<MentorshipSession[]>(MENTORSHIPS);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<number | null>(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState<Partial<MentorshipSession>>({});

    // Filtros
    const [filterStatus, setFilterStatus] = React.useState('all');

    // Helper para avatar de mentor
    const getMentorAvatar = (name: string) => {
        const m = AVAILABLE_MENTORS.find(me => me.name === name);
        return m?.avatar || name.charAt(0);
    };

    // HU 6.2: Analytics Calculations
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Top Mentors logic
    const mentorCounts = sessions.reduce((acc, session) => {
        const name = session.mentor;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topMentors = Object.entries(mentorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const filteredSessions = sessions.filter(s => {
        if (filterStatus === 'all') return true;
        return s.status === filterStatus;
    });

    const handleCreateSession = () => {
        if (!editForm.mentor || !editForm.mentee || !editForm.date) return;

        const newSession: MentorshipSession = {
            id: Date.now(),
            mentor: editForm.mentor,
            title: editForm.title || "Sesión General",
            mentee: editForm.mentee,
            date: editForm.date,
            time: editForm.time || "09:00",
            type: 'individual',
            status: 'scheduled',
            link: "https://zoom.us/j/123456789",
            joinUrl: "https://zoom.us/j/123456789"
        };

        setSessions([newSession, ...sessions]);
        setShowCreateModal(false);
        setEditForm({});
    };

    const handleEditSession = () => {
        if (!editForm.id) return;
        setSessions(sessions.map(s => s.id === editForm.id ? { ...s, ...editForm } : s));
        setIsEditing(false);
        setEditForm({});
        setShowCreateModal(false);
    };

    const handleDeleteSession = (id: number) => {
        setSessions(sessions.filter(s => s.id !== id));
        setShowDeleteConfirm(null);
    };

    const openEditModal = (session: MentorshipSession) => {
        setEditForm(session);
        setIsEditing(true);
        setShowCreateModal(true);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
            <header className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestión de Mentorías</h1>
                    <p className="text-slate-500">Supervisa y gestiona la oferta de mentorías para los líderes.</p>
                </div>
                <button
                    onClick={() => { setIsEditing(false); setEditForm({}); setShowCreateModal(true); }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 shadow-md transition-colors"
                >
                    <Plus size={16} /> Programar Sesión
                </button>
            </header>

            {/* HU 6.2: Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Total Sesiones</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalSessions}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Pendientes</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{scheduledSessions}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckSquare size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Completadas</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{completedSessions} <span className="text-xs text-slate-400 font-normal">({completionRate}%)</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Star size={20} /></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Top Mentor</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 truncate">{topMentors[0]?.[0] || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{topMentors[0]?.[1] || 0} sesiones</p>
                </div>
            </div>

            {/* HU 6.1: Active Sessions Management */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700">Sesiones Programadas</h3>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm border-slate-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="scheduled">Programadas</option>
                        <option value="completed">Completadas</option>
                        <option value="cancelled">Canceladas</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Mentor</th>
                                <th className="px-6 py-3">Líder (Mentee)</th>
                                <th className="px-6 py-3">Fecha y Hora</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 flex items-center gap-2 font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                            {getMentorAvatar(session.mentor)}
                                        </div>
                                        {session.mentor}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{session.mentee || 'Sin asignar'}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm">{session.date}</p>
                                        <p className="text-xs text-slate-500">{session.time}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${session.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                                            session.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                            {session.status === 'scheduled' ? 'Programada' :
                                                session.status === 'completed' ? 'Realizada' : 'Cancelada'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(session)}
                                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-500"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(session.id)}
                                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">{isEditing ? 'Editar Sesión' : 'Programar Nueva Sesión'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mentor</label>
                                <select
                                    value={editForm.mentor || ''}
                                    onChange={e => setEditForm({ ...editForm, mentor: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                >
                                    <option value="">Seleccionar Mentor...</option>
                                    {AVAILABLE_MENTORS.map(m => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Líder (Mentee)</label>
                                <select
                                    value={editForm.mentee || ''}
                                    onChange={e => setEditForm({ ...editForm, mentee: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                >
                                    <option value="">Seleccionar Líder...</option>
                                    {MENTEES.map(m => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={editForm.date || ''}
                                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        value={editForm.time || ''}
                                        onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tema / Notas</label>
                                <input
                                    type="text"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    placeholder="Ej: Revisión de objetivos Q1"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={isEditing ? handleEditSession : handleCreateSession}
                                disabled={!editForm.mentor || !editForm.mentee || !editForm.date}
                                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEditing ? 'Guardar Cambios' : 'Agendar Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="bg-white p-8 rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">¿Eliminar sesión?</h3>
                            <p className="text-sm text-slate-500 mt-2">Esta acción cancelará la mentoría y notificará a los participantes.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={() => handleDeleteSession(showDeleteConfirm)} className="flex-1 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MentorshipManager() {
    const { currentUser, currentRole } = useUser();

    // ROL GESTOR: Mostrar vista administrativa (HU 6.1 & 6.2)
    if (currentRole === 'gestor') {
        return <GestorMentorshipManager />;
    }

    // ROL MENTOR: Mostrar vista de gestión de sesiones
    if (currentUser?.role === 'mentor') {
        return <MentorSessionsManager />;
    }

    const [activeTab, setActiveTab] = React.useState<'active' | 'history' | 'schedule'>('active');
    const [sessions, setSessions] = React.useState<MentorshipSession[]>(MENTORSHIPS);
    const [showSuccess, setShowSuccess] = React.useState(false);

    // Discovery Flow State
    const [bookingStep, setBookingStep] = React.useState<'discovery' | 'slots'>('discovery');
    const [selectedMentorData, setSelectedMentorData] = React.useState<Mentor | null>(null);
    const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
    const [specialtyFilter, setSpecialtyFilter] = React.useState('Todos');

    // Filter sessions
    const activeSessions = sessions.filter(s => s.status === 'scheduled');
    const pastSessions = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'pending_rating');

    // Handle Rating
    const handleRate = (id: number, rating: number) => {
        setSessions(sessions.map(s => s.id === id ? { ...s, status: 'completed', rating } : s));
    };

    // Handle Mentor Selection (Step 1)
    const handleSelectMentor = (mentor: Mentor) => {
        setSelectedMentorData(mentor);
        setBookingStep('slots');
        setSelectedSlot(null);
    };

    // Handle Slot Selection (Step 2) -> Booking (Step 3)
    const handleConfirmBooking = () => {
        if (!selectedMentorData || !selectedSlot) return;

        // Phase 1, Step 3: Confirmation & Generation of Link (Backend)
        const mockZoomLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
        const dateObj = new Date(selectedSlot);

        const newSession: MentorshipSession = {
            id: Date.now(),
            title: "Mentoría Agendada",
            mentor: selectedMentorData.name,
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'individual',
            status: 'scheduled',
            link: mockZoomLink,
            joinUrl: mockZoomLink
        };

        setSessions([...sessions, newSession]);
        setShowSuccess(true);

        // Reset
        setTimeout(() => {
            setShowSuccess(false);
            setActiveTab('active');
            setBookingStep('discovery');
            setSelectedMentorData(null);
            setSelectedSlot(null);
        }, 2500);
    };

    // Filter Mentors
    const filteredMentors = AVAILABLE_MENTORS.filter(m =>
        specialtyFilter === 'Todos' || m.specialty === specialtyFilter || m.sector === specialtyFilter
    );

    const categories = ['Todos', 'Shine Within', 'Shine Out', 'Shine Up', 'Liderazgo', 'Tecnología', 'Marketing'];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4 transform scale-100 animate-bounce-subtle">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                            <Video size={40} strokeWidth={2} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Mentoría Confirmada!</h2>
                        <p className="text-slate-500 mb-4">Hemos enviado el enlace de Zoom a tu correo y calendario.</p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 break-all">
                            zoom.us/j/conf_123...
                        </div>
                    </div>
                </div>
            )}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Mis Mentorías</h2>
                <p className="text-slate-500">Gestiona tus sesiones y tu plan de acompañamiento.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar size={16} /> Próximas Sesiones
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <CheckSquare size={16} /> Historial
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock size={16} /> Agendar Nueva
                </button>
            </div>

            {/* CONTENT: Active Sessions (HU 6.2, 6.3) */}
            {activeTab === 'active' && (
                <div className="space-y-4">
                    {activeSessions.length > 0 ? activeSessions.map(session => (
                        <div key={session.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${session.type === 'individual' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    {session.type === 'individual' ? <Users size={24} /> : <Users size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${session.type === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {session.type}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} /> {session.date}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800">{session.title}</h3>
                                    <p className="text-sm text-slate-500">con <span className="font-bold">{session.mentor}</span> • {session.time}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition">
                                    Reprogramar
                                </button>
                                <a href={session.joinUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-900/10">
                                    <Video size={16} /> Unirse
                                </a>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-slate-600 font-bold">No tienes sesiones programadas</h3>
                            <p className="text-slate-400 text-sm mb-4">Agenda tu próxima mentoría para continuar avanzando.</p>
                            <button onClick={() => setActiveTab('schedule')} className="text-amber-600 font-bold text-sm hover:underline">Agendar Ahora</button>
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT: History (HU 6.4) */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {pastSessions.map(session => (
                        <div key={session.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 opacity-90 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <CheckSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700">{session.title}</h3>
                                    <p className="text-xs text-slate-500">{session.date} • {session.mentor}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {session.status === 'pending_rating' ? (
                                    <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        <span className="text-xs font-bold text-amber-700 mr-2">Calificar:</span>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => handleRate(session.id, star)} className="text-slate-300 hover:text-amber-500 transition">
                                                <Star size={16} fill="none" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-slate-400 mr-2">Tu calificación:</span>
                                        {[...Array(session.rating || 0)].map((_, i) => (
                                            <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CONTENT: Schedule (HU 6.1) */}
            {activeTab === 'schedule' && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-2xl text-slate-800">Agendar Mentoría Individual</h3>
                            <p className="text-slate-500">Encuentra a tu mentor ideal y reserva tu espacio.</p>
                        </div>
                        {currentUser?.planType === 'VIP' && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                                Plan VIP: Ilimitado
                            </span>
                        )}
                    </div>

                    {/* Step 1: Discovery (Listar Mentores) */}
                    {bookingStep === 'discovery' && (
                        <div className="animate-fade-in">
                            {/* Filters */}
                            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSpecialtyFilter(cat)}
                                        className={clsx(
                                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                                            specialtyFilter === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredMentors.map(mentor => (
                                    <div key={mentor.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                                            {mentor.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-lg text-slate-800">{mentor.name}</h4>
                                                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                                    <Star size={14} fill="currentColor" /> {mentor.rating}
                                                </div>
                                            </div>
                                            <p className="text-sm text-amber-600 font-medium mb-2">{mentor.specialty} • {mentor.sector}</p>
                                            <button
                                                onClick={() => handleSelectMentor(mentor)}
                                                className="w-full py-2 bg-white border border-slate-900 text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-900 hover:text-white transition-colors"
                                            >
                                                Ver Disponibilidad
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Availability (Slots) */}
                    {bookingStep === 'slots' && selectedMentorData && (
                        <div className="animate-fade-in">
                            <button onClick={() => setBookingStep('discovery')} className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1">
                                <ArrowRight className="rotate-180" size={14} /> Volver a mentores
                            </button>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-700">
                                    {selectedMentorData.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-slate-800">{selectedMentorData.name}</h4>
                                    <p className="text-slate-500">{selectedMentorData.specialty}</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-800 mb-4">Horarios Disponibles</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {selectedMentorData.availability.map(slot => {
                                    const date = new Date(slot);
                                    const dateStr = date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const isSelected = selectedSlot === slot;

                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={clsx(
                                                "p-4 rounded-xl border text-left transition-all",
                                                isSelected
                                                    ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
                                                    : "border-slate-200 bg-white hover:border-amber-300"
                                            )}
                                        >
                                            <p className={clsx("text-xs font-bold uppercase mb-1", isSelected ? "text-amber-700" : "text-slate-400")}>{dateStr}</p>
                                            <p className={clsx("text-lg font-bold", isSelected ? "text-slate-900" : "text-slate-700")}>{timeStr}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedSlot}
                                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} /> Confirmar Reserva
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
// --- COMPONENTE GESTOR DE NETWORKING ---
function NetworkingManager() {
    const [activeTab, setActiveTab] = React.useState<'directory' | 'groups'>('directory');
    const [users, setUsers] = React.useState<NetworkingContact[]>(NETWORKING);
    const [selectedUser, setSelectedUser] = React.useState<NetworkingContact | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedSector, setSelectedSector] = React.useState('Todos');

    // Filters
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSector = selectedSector === 'Todos' ? true : u.sector === selectedSector;
        return matchesSearch && matchesSector;
    });

    const categories = ['Todos', ...Array.from(new Set(users.map(u => u.sector)))];

    const handleConnect = (id: number) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: 'pending' } : u));
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Networking</h2>
                <p className="text-slate-500">Conecta con líderes y únete a grupos de discusión.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('directory')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'directory' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16} /> Directorio de Líderes
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'groups' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageCircle size={16} /> Grupos de Interés
                </button>
            </div>

            {/* DIRECTORY VIEW (HU 7.1, 7.2, 7.3) */}
            {activeTab === 'directory' && !selectedUser && (
                <>
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, empresa o cargo..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                className="pl-9 pr-10 py-2 border rounded-lg bg-white border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none min-w-[180px]"
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col items-center text-center group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <button onClick={() => setSelectedUser(user)} className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-4 flex items-center justify-center text-2xl text-slate-500 font-bold shadow-inner transform group-hover:scale-110 transition-transform">
                                    {user.avatar}
                                </button>
                                <h3 className="font-bold text-lg text-slate-800 cursor-pointer hover:text-amber-600" onClick={() => setSelectedUser(user)}>{user.name}</h3>
                                <p className="text-sm text-amber-600 font-medium mb-1">{user.role}</p>
                                <p className="text-xs text-slate-400 mb-5">{user.company} • {user.location}</p>
                                <div className="flex flex-wrap gap-2 justify-center mb-6">
                                    {user.tags.slice(0, 3).map(t => (
                                        <span key={t} className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] px-2 py-1 rounded-full font-medium">{t}</span>
                                    ))}
                                </div>

                                {user.status === 'connected' ? (
                                    <button className="mt-auto w-full py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold text-sm flex items-center justify-center gap-2 cursor-default">
                                        <Check size={16} /> Conectado
                                    </button>
                                ) : user.status === 'pending' ? (
                                    <button className="mt-auto w-full py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-default">
                                        <Clock size={16} /> Pendiente
                                    </button>
                                ) : (
                                    <button onClick={() => handleConnect(user.id)} className="mt-auto w-full py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-900 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                                        <UserPlus size={16} /> Conectar
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* PUBLIC PROFILE DETAIL (HU 7.2) */}
            {activeTab === 'directory' && selectedUser && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
                    <div className="h-32 bg-slate-800 relative">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                            <ArrowRight size={20} className="rotate-180" />
                        </button>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-between items-end">
                            <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-lg">
                                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-4xl font-bold text-slate-400">
                                    {selectedUser.avatar}
                                </div>
                            </div>
                            <div className="flex gap-3 mb-2">
                                {selectedUser.status === 'none' && (
                                    <button onClick={() => handleConnect(selectedUser.id)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">
                                        Conectar
                                    </button>
                                )}
                                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 hover:border-amber-200 transition">
                                    <MessageSquare size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">{selectedUser.name}</h2>
                            <p className="text-lg text-amber-600 font-medium">{selectedUser.role} en {selectedUser.company}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {selectedUser.location}</span>
                                <span className="flex items-center gap-1"><Briefcase size={14} /> {selectedUser.experience} años exp.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Acerca de</h3>
                                    <p className="text-slate-600 leading-relaxed">{selectedUser.bio}</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Experiencia & Sector</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-bold">{selectedUser.sector}</span>
                                        {selectedUser.tags.map(t => (
                                            <span key={t} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl h-fit border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={16} /> Contacto</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm"><Link size={14} /></div>
                                        <span className="truncate">linkedin.com/in/{selectedUser.name.toLowerCase().replace(' ', '-')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INTEREST GROUPS (HU 7.4) */}
            {activeTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {INTEREST_GROUPS.map(group => (
                        <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${group.image}`}>
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{group.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 flex-1">{group.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                    <Users size={12} /> {group.members} miembros
                                </span>
                                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition">
                                    Unirme
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// --- COMPONENTE GESTOR DE CONVOCATORIAS ---
function JobsManager() {
    const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
    const [appliedJobs, setAppliedJobs] = React.useState<number[]>([]);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleApply = () => {
        if (selectedJob) {
            setAppliedJobs([...appliedJobs, selectedJob.id]);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setSelectedJob(null);
            }, 2500);
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Convocatorias</h2>
                <p className="text-slate-500">Oportunidades exclusivas para la comunidad 4Shine.</p>
            </div>

            {/* Job List (HU 8.1) */}
            {!selectedJob && (
                <div className="grid gap-4">
                    {JOBS.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {appliedJobs.includes(job.id) && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
                                    POSTULADO
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm group-hover:bg-green-100 transition-colors">
                                    <Building size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-amber-600 transition-colors">{job.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{job.company} • {job.location}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {job.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0 pl-16 md:pl-0">
                                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">{job.type}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> {job.postedDate}</span>
                            </div>
                            <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                <ArrowRight className="text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Job Detail & Application (HU 8.2) */}
            {selectedJob && !showSuccess && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-fade-in relative">
                    <button
                        onClick={() => setSelectedJob(null)}
                        className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                    >
                        <ArrowRight size={20} className="rotate-180" />
                    </button>

                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-6 mb-8 mt-4 md:mt-0">
                            <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                                <Building size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800 mb-2">{selectedJob.title}</h1>
                                <div className="flex flex-wrap gap-4 text-slate-500 text-sm font-medium">
                                    <span className="flex items-center gap-1"><Building size={16} /> {selectedJob.company}</span>
                                    <span className="flex items-center gap-1"><MapPin size={16} /> {selectedJob.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase size={16} /> {selectedJob.type}</span>
                                    <span className="flex items-center gap-1"><Users size={16} /> {selectedJob.applicants} postulantes</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-8">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-4">Descripción del Rol</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">{selectedJob.description}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <h4 className="font-bold text-slate-800 mb-2">Requisitos Clave</h4>
                                    <ul className="list-disc list-inside space-y-2 text-slate-600">
                                        <li>Experiencia comprobable en roles de liderazgo similar.</li>
                                        <li>Habilidades avanzadas de comunicación y gestión de stakeholders.</li>
                                        <li>Alineación con la cultura y valores de {selectedJob.company}.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-xl shadow-lg shadow-amber-500/5 border border-amber-100 sticky top-4">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">Postularme ahora</h3>
                                    <p className="text-sm text-slate-500 mb-6">Tu perfil de 4Shine se enviará automáticamente al reclutador.</p>

                                    {appliedJobs.includes(selectedJob.id) ? (
                                        <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold text-center border border-green-200 flex items-center justify-center gap-2">
                                            <Check size={20} /> Ya te has postulado
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleApply}
                                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                                        >
                                            <Send size={18} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                            Enviar Solicitud
                                        </button>
                                    )}
                                    <p className="text-xs text-center text-slate-400 mt-4">La postulación cierra en 5 días.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success State */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4 transform scale-100 animate-bounce-subtle">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Postulación Enviada!</h2>
                        <p className="text-slate-500">Hemos enviado tu perfil a {selectedJob?.company}. Te notificaremos cualquier novedad.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTES ATÓMICOS DE TRAYECTORIA ---

function JourneyTimeline({ steps }: { steps: typeof TIMELINE }) {
    // Logic: Emit event on 'active' test click (Visual only for now)
    const handleStepClick = (step: typeof TIMELINE[0]) => {
        if (step.status === 'current') {
            console.log("Open Test Runner for:", step.title);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h3 className="font-bold text-lg text-slate-700 mb-6 flex items-center gap-2">
                <MapPin className="text-amber-500" size={20} /> Línea de Tiempo
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-8 py-2">
                {steps.map((evt) => (
                    <div key={evt.id} className="relative group">
                        {/* Status Dot */}
                        <div className={clsx(
                            "absolute -left-[41px] w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-colors",
                            evt.status === 'completed' ? 'bg-green-500' :
                                evt.status === 'current' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                        )}>
                            {evt.status === 'completed' && <CheckSquare size={10} className="text-white" />}
                            {evt.status === 'locked' && <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />}
                        </div>

                        {/* Card */}
                        <div
                            onClick={() => handleStepClick(evt)}
                            className={clsx(
                                "p-4 rounded-xl border transition-all relative",
                                evt.status === 'current' ? 'bg-amber-50 border-amber-200 cursor-pointer hover:shadow-md hover:scale-[1.02]' :
                                    evt.status === 'locked' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100'
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{evt.date}</span>
                                {evt.status === 'locked' && <Lock size={12} className="text-slate-400" />}
                            </div>
                            <h4 className="font-bold text-slate-800 mt-1">{evt.title}</h4>
                            <span className={clsx(
                                "inline-block mt-2 px-2 py-0.5 rounded text-[10px] border",
                                evt.status === 'current' ? "bg-white border-amber-200 text-amber-600 font-bold" : "bg-white border-slate-200 text-slate-500"
                            )}>
                                {evt.type === 'test' ? 'Evaluación' : evt.type === 'mentoria' ? 'Mentoría' : 'Hito'}
                            </span>

                            {evt.status === 'current' && (
                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600 animate-bounce-subtle">
                                    Comenzar Ahora <ArrowRight size={12} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NextChallengeCard({ challenge }: { challenge: any }) {
    return (
        <div className="group p-4 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer bg-white">
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${challenge.type === 'strategic' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {challenge.type === 'strategic' ? <Target size={20} /> : <Users size={20} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{challenge.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{challenge.description}</p>
                </div>
                <button className="self-center px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    Iniciar
                </button>
            </div>
        </div>
    );
}

// --- CONTAINER PRINCIPAL (SMART COMPONENT) ---
function TrajectoryManager() {
    const { currentUser } = useUser();

    // In a real app, we would fetch trajectory state here
    // const { data } = useTrajectory(currentUser.id);

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Mi Trayectoria</h2>
                <p className="text-slate-500">Visualiza tu evolución y gestiona tus 5 hitos clave.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                {/* Timeline Column */}
                <div className="lg:col-span-5">
                    <JourneyTimeline steps={TIMELINE} />
                </div>

                {/* Right Column: Radar & Challenges */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Radar Chart (Dumb Component) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center h-min">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-700">Resultados de Impacto</h3>
                            <button className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition">
                                Ver Informe Completo
                            </button>
                        </div>
                        <div className="w-full h-[320px]">
                            <RadarChart />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500/20 border border-amber-500 rounded-full"></div> Tu Nivel (Test Actual)</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 border border-slate-400 border-dashed rounded-full"></div> Nivel Objetivo</div>
                        </div>
                    </div>

                    {/* Next Challenges Container */}
                    {currentUser?.nextChallenges && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                                <Flag className="text-amber-500" size={20} /> Próximos Desafíos
                            </h3>
                            <div className="space-y-3">
                                {currentUser.nextChallenges.map((challenge: any) => (
                                    <NextChallengeCard key={challenge.id} challenge={challenge} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reconocimientos / Insignias Section (HU 7.x) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                            <Medal className="text-amber-500" size={20} /> Reconocimientos
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Mock Badge 1 */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2 hover:border-amber-200 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">Liderazgo 2025</h4>
                                    <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-100">Certificado</p>
                                </div>
                            </div>

                            {/* Mock Badge 2 */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2 hover:border-amber-200 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                    <Medal size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-xs">Gestión Ágil</h4>
                                    <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full mt-1 border border-green-100">Completado</p>
                                </div>
                            </div>

                            {/* Locked Badge */}
                            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2 opacity-60 grayscale">
                                <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-1">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-600 text-xs">Innovación Corp</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Bloqueado</p>
                                </div>
                            </div>

                            {/* Locked Badge */}
                            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2 opacity-60 grayscale">
                                <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-1">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-600 text-xs">Mentor Master</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Bloqueado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
// --- COMPONENTE GESTOR DE MENSAJES (CHAT) ---
function MessagesManager() {
    const [selectedChatId, setSelectedChatId] = React.useState<number | null>(null);
    const [chats, setChats] = React.useState<Chat[]>(CHATS);
    const [newMessage, setNewMessage] = React.useState('');

    const selectedChat = chats.find(c => c.id === selectedChatId);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const msg: Message = {
            id: Date.now(),
            senderId: 'me',
            content: newMessage,
            timestamp: "Just now"
        };

        const updatedChats = chats.map(c => {
            if (c.id === selectedChat.id) {
                return {
                    ...c,
                    messages: [...c.messages, msg],
                    lastMessage: newMessage,
                    lastMessageTime: "Just now"
                };
            }
            return c;
        });

        setChats(updatedChats);
        setNewMessage('');
    };

    const getParticipantName = (id: number) => {
        const contact = NETWORKING.find(u => u.id === id);
        return contact ? contact.name : "Usuario";
    };

    const getParticipantAvatar = (id: number) => {
        const contact = NETWORKING.find(u => u.id === id);
        return contact ? contact.avatar : "U";
    };

    return (
        <div className="animate-fade-in h-[calc(100vh-140px)] flex gap-6">
            {/* Sidebar de Chats */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-slate-50 border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={clsx(
                                "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-4",
                                selectedChatId === chat.id ? "bg-amber-50/50 border-l-4 border-l-amber-500" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                                {getParticipantAvatar(chat.participantId)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-bold text-slate-800 truncate">{getParticipantName(chat.participantId)}</h4>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{chat.lastMessageTime}</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="flex flex-col justify-center">
                                    <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                                        {chat.unread}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Ventana de Chat */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                    {getParticipantAvatar(selectedChat.participantId)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{getParticipantName(selectedChat.participantId)}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs text-slate-500">En línea</span>
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
                                <LogOut className="rotate-90" size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {selectedChat.messages.map(msg => (
                                <div key={msg.id} className={clsx("flex", msg.senderId === 'me' ? "justify-end" : "justify-start")}>
                                    <div className={clsx(
                                        "max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                                        msg.senderId === 'me'
                                            ? "bg-slate-900 text-white rounded-br-none"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                                    )}>
                                        <p>{msg.content}</p>
                                        <span className={clsx("text-[10px] block mt-2 opacity-70", msg.senderId === 'me' ? "text-right" : "text-left")}>
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 px-4 py-3 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">Tus Mensajes</h3>
                        <p>Selecciona una conversación para comenzar a chatear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- WORKSHOPS MANAGER COMPONENTS (New Module) ---
function WorkshopsManager() {
    const { currentUser, currentRole } = useUser();
    const [workshops, setWorkshops] = React.useState<Workshop[]>(WORKSHOPS);
    const [filter, setFilter] = React.useState<'upcoming' | 'completed'>('upcoming');
    const [selectedWorkshop, setSelectedWorkshop] = React.useState<Workshop | null>(null);
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    // Gestor Editing State
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState<Partial<Workshop>>({});

    const filteredWorkshops = workshops.filter(w => w.status === filter);
    const isGestor = currentRole === 'gestor';

    const handleRegister = (workshopId: number) => {
        if (!currentUser) return;
        setWorkshops(workshops.map(w => {
            if (w.id === workshopId) {
                // Check if user is already registered (by name since mock ID isn't consistent)
                const isRecognized = w.attendees.some(a => a.name === currentUser.name);

                if (isRecognized) {
                    return { ...w, attendees: w.attendees.filter(a => a.name !== currentUser.name) };
                } else {
                    if (!currentRole) return w;
                    return { ...w, attendees: [...w.attendees, { id: Date.now(), name: currentUser.name, avatar: currentUser.avatar, role: currentRole }] };
                }
            }
            return w;
        }));
    };

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este evento?")) {
            setWorkshops(workshops.filter(w => w.id !== id));
        }
    };

    const handleSave = () => {
        if (!editForm.title || !editForm.date) return;

        if (isEditing && editForm.id) {
            setWorkshops(workshops.map(w => w.id === editForm.id ? { ...w, ...editForm } as Workshop : w));
        } else {
            const newWorkshop: Workshop = {
                id: Date.now(),
                title: editForm.title!,
                description: editForm.description || "",
                date: editForm.date!,
                time: editForm.time || "10:00",
                type: editForm.type || 'Otro',
                facilitator: editForm.facilitator || currentUser?.name || "Facilitador",
                attendees: [],
                status: 'upcoming',
                link: editForm.link
            } as Workshop;
            setWorkshops([newWorkshop, ...workshops]);
        }
        setShowCreateModal(false);
        setEditForm({});
        setIsEditing(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Workshops & Eventos</h2>
                    <p className="text-slate-500">Sesiones de relacionamiento, formación e innovación.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-bold">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={clsx("px-4 py-2 rounded-md transition-all", filter === 'upcoming' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Próximos
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={clsx("px-4 py-2 rounded-md transition-all", filter === 'completed' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Pasados
                        </button>
                    </div>
                    {isGestor && (
                        <button
                            onClick={() => { setIsEditing(false); setEditForm({}); setShowCreateModal(true); }}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
                        >
                            <Plus size={18} /> Crear Evento
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkshops.map(workshop => {
                    const isRegistered = workshop.attendees.some(a => a.name === currentUser?.name);

                    return (
                        <div key={workshop.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                            <div
                                onClick={() => !isGestor && setSelectedWorkshop(workshop)}
                                className={clsx("h-32 p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer",
                                    workshop.type === 'Relacionamiento' ? "bg-fuchsia-600" :
                                        workshop.type === 'Innovación' ? "bg-indigo-600" :
                                            workshop.type === 'Wellbeing' ? "bg-emerald-600" : "bg-slate-700"
                                )}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <span className="relative z-10 inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white w-fit border border-white/10">
                                    {workshop.type}
                                </span>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">{workshop.title}</h3>

                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400" /> {workshop.date}</div>
                                    <div className="flex items-center gap-1.5"><Clock size={16} className="text-slate-400" /> {workshop.time}</div>
                                </div>

                                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{workshop.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex -space-x-2">
                                        {workshop.attendees.slice(0, 3).map((a, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600" title={a.name}>
                                                {a.avatar}
                                            </div>
                                        ))}
                                        {workshop.attendees.length > 3 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                +{workshop.attendees.length - 3}
                                            </div>
                                        )}
                                        {workshop.attendees.length === 0 && <span className="text-xs text-slate-400 italic py-1">Sin inscritos</span>}
                                    </div>

                                    {isGestor ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditForm(workshop); setIsEditing(true); setShowCreateModal(true); }} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(workshop.id)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRegister(workshop.id); }}
                                            className={clsx(
                                                "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                                                isRegistered
                                                    ? "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500"
                                                    : "bg-slate-900 text-white border-transparent hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/20"
                                            )}
                                        >
                                            {isRegistered ? "Cancelar" : "Inscribirme"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Workshop Detail Modal */}
            {
                selectedWorkshop && !showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedWorkshop(null)}>
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className={clsx("h-40 p-8 flex flex-col justify-end relative overflow-hidden",
                                selectedWorkshop.type === 'Relacionamiento' ? "bg-fuchsia-600" :
                                    selectedWorkshop.type === 'Innovación' ? "bg-indigo-600" :
                                        selectedWorkshop.type === 'Wellbeing' ? "bg-emerald-600" : "bg-slate-700"
                            )}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <button onClick={() => setSelectedWorkshop(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10">
                                    <X size={20} />
                                </button>
                                <span className="relative z-10 inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white w-fit border border-white/10 mb-2">
                                    {selectedWorkshop.type}
                                </span>
                                <h2 className="relative z-10 text-3xl font-bold text-white">{selectedWorkshop.title}</h2>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-amber-500" /> {selectedWorkshop.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hora</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-amber-500" /> {selectedWorkshop.time}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lugar</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-amber-500" /> Hotel Intercontinental, Salón Grand</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-3">Detalles del Evento</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg">{selectedWorkshop.description}</p>
                                    <p className="mt-4 text-slate-500 text-sm italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        Este es un evento presencial de demostración. En la versión final, aquí se mostrarían detalles específicos de la agenda, speakers invitados y logística detallada.
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Users size={18} /> Asistentes ({selectedWorkshop.attendees.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedWorkshop.attendees.map((attendee, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-50 pl-1 pr-3 py-1 rounded-full border border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {attendee.avatar}
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{attendee.name}</span>
                                            </div>
                                        ))}
                                        {selectedWorkshop.attendees.length === 0 && <span className="text-sm text-slate-400 italic">Sé el primero en inscribirte.</span>}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    {isGestor ? (
                                        <button
                                            onClick={() => { setSelectedWorkshop(null); setEditForm(selectedWorkshop); setIsEditing(true); setShowCreateModal(true); }}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <Edit size={18} /> Editar Evento
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRegister(selectedWorkshop.id)}
                                            className={clsx(
                                                "py-3 px-8 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2",
                                                selectedWorkshop.attendees.some(a => a.name === currentUser?.name)
                                                    ? "bg-white border-2 border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500 hover:shadow-none"
                                                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
                                            )}
                                        >
                                            {selectedWorkshop.attendees.some(a => a.name === currentUser?.name) ? (
                                                <>Cancelar Inscripción</>
                                            ) : (
                                                <>Inscribirme al Evento</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Create/Edit */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Editar Evento" : "Nuevo Workshop"}</h3>
                                <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-slate-400 hover:text-slate-700" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Ej. Masterclass de Liderazgo" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha</label>
                                        <input type="date" className="w-full p-2 border border-slate-200 rounded-lg" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Hora</label>
                                        <input type="time" className="w-full p-2 border border-slate-200 rounded-lg" value={editForm.time || ''} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                                    <select className="w-full p-2 border border-slate-200 rounded-lg" value={editForm.type || 'Otro'} onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}>
                                        <option value="Relacionamiento">Relacionamiento</option>
                                        <option value="Formación">Formación</option>
                                        <option value="Innovación">Innovación</option>
                                        <option value="Wellbeing">Wellbeing</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Link Reunión (Zoom/Meet)</label>
                                    <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={editForm.link || ''} onChange={e => setEditForm({ ...editForm, link: e.target.value })} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                                    <textarea className="w-full p-2 border border-slate-200 rounded-lg h-24 resize-none" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Detalles del evento..." />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition">Cancelar</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-lg">Guardar Evento</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// --- MENTOR TRAINING VIEW (New Module) ---
function MentorTrainingView() {
    const { currentUser } = useUser();
    const [courses, setCourses] = React.useState(MENTOR_TRAINING);
    const [activeCourseId, setActiveCourseId] = React.useState<number | null>(null);
    const [scormModule, setScormModule] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<'modules' | 'comments'>('modules');
    const [commentText, setCommentText] = React.useState('');

    const activeCourse = React.useMemo(() =>
        courses.find(c => c.id === activeCourseId) || null
        , [courses, activeCourseId]);

    const modules = [
        { title: "Introducción al Módulo", duration: "5 min", type: "video" },
        { title: "Fundamentos Teóricos", duration: "15 min", type: "text" },
        { title: "Caso de Estudio Práctico", duration: "10 min", type: "interactive" },
        { title: "Evaluación de Conocimientos", duration: "15 min", type: "quiz" }
    ];

    const handleLike = (e: React.MouseEvent, courseId: number) => {
        e.stopPropagation();
        setCourses(prevCourses => prevCourses.map(c => {
            if (c.id === courseId) {
                return {
                    ...c,
                    liked: !c.liked,
                    likes: c.liked ? c.likes - 1 : c.likes + 1
                };
            }
            return c;
        }));
    };

    const handleAddComment = () => {
        if (!commentText.trim() || !activeCourseId) return;

        const newCommentObj: Comment = {
            id: Date.now(),
            author: currentUser?.name || "Mentor",
            text: commentText,
            date: new Date().toISOString().split('T')[0],
            role: "Mentor",
            avatar: currentUser?.avatar || "M"
        };

        setCourses(prevCourses => prevCourses.map(c => {
            if (c.id === activeCourseId) {
                return {
                    ...c,
                    commentsArray: [newCommentObj, ...(c.commentsArray || [])]
                };
            }
            return c;
        }));

        setCommentText('');
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                        <Book size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Formación de Mentores</h2>
                        <p className="text-slate-500">Recursos y cursos exclusivos para mejorar tu práctica como mentor.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer flex flex-col h-full">
                        <div className="bg-slate-900 h-32 relative overflow-hidden flex items-center justify-center shrink-0">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Package size={32} />
                            </div>
                            <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                SCORM
                            </span>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{course.category}</div>
                                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                    <Heart size={14} className={course.liked ? "fill-pink-500 text-pink-500" : ""} />
                                    {course.likes}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h3>

                            <div className="mt-auto space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                        <span>Progreso</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                                    {course.commentsArray?.length > 0 && (
                                        <span className="flex items-center gap-1"><MessageCircle size={14} /> {course.commentsArray.length}</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setActiveCourseId(course.id); setActiveTab('modules'); }}
                                    className={clsx(
                                        "w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                        course.progress === 100
                                            ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                                            : "border border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                                    )}
                                >
                                    <Monitor size={18} />
                                    {course.progress === 0 ? "Iniciar Curso" : course.progress === 100 ? "Repasar Curso" : "Continuar Curso"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SCORM Player Modal */}
            {activeCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full h-full md:w-[95vw] md:h-[90vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-scale-up">
                        {/* Player Sidebar */}
                        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-200 bg-white">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{activeCourse.title}</h3>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${activeCourse.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{activeCourse.progress}%</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleLike(e, activeCourse.id)}
                                        className={clsx(
                                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors",
                                            activeCourse.liked ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        <Heart size={14} className={activeCourse.liked ? "fill-pink-500" : ""} />
                                        {activeCourse.likes}
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar Tabs */}
                            <div className="flex border-b border-slate-200 bg-white">
                                <button
                                    onClick={() => setActiveTab('modules')}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2",
                                        activeTab === 'modules' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Temario
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2",
                                        activeTab === 'comments' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Discusión
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50">
                                {activeTab === 'modules' ? (
                                    <div className="p-2 space-y-1">
                                        {modules.map((mod, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setScormModule(idx)}
                                                className={clsx(
                                                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all text-sm",
                                                    scormModule === idx ? "bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-500" : "text-slate-500 hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                                    scormModule === idx ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-500"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="truncate">{mod.title}</div>
                                                    <div className="text-[10px] opacity-70 flex items-center gap-1">
                                                        {mod.type === 'video' ? <Video size={10} /> : mod.type === 'quiz' ? <ClipboardCheck size={10} /> : <FileText size={10} />}
                                                        {mod.duration}
                                                    </div>
                                                </div>
                                                {idx < scormModule && <Check size={14} className="text-green-500" />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 p-4 space-y-4">
                                            {activeCourse.commentsArray && activeCourse.commentsArray.length > 0 ? (
                                                activeCourse.commentsArray.map((comment: Comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                            {comment.avatar || comment.author[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-white p-3 rounded-tl-none rounded-2xl shadow-sm text-sm text-slate-600">
                                                                <span className="block font-bold text-slate-800 text-xs mb-1">{comment.author} <span className="text-slate-400 font-normal">• {comment.role}</span></span>
                                                                {comment.text}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1 pl-2">{comment.date}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-slate-400">
                                                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-xs">Aún no hay comentarios. ¡Sé el primero!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'comments' && (
                                <div className="p-3 border-t border-slate-200 bg-white">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Escribe un comentario..."
                                            className="w-full pl-4 pr-10 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="absolute right-1 top-1 p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'modules' && (
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <button onClick={() => setActiveCourseId(null)} className="w-full py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 font-bold text-sm">
                                        Salir del Curso
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Player Content */}
                        <div className="flex-1 flex flex-col bg-slate-900 relative">
                            <button onClick={() => setActiveCourseId(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition md:hidden">
                                <X size={20} />
                            </button>

                            <div className="flex-1 flex items-center justify-center p-8 bg-black">
                                <div className="max-w-4xl w-full aspect-video bg-slate-800 rounded-xl shadow-2xl flex items-center justify-center flex-col gap-4 text-slate-400 border border-slate-700 relative overflow-hidden group">
                                    {modules[scormModule].type === 'video' ? (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform cursor-pointer border border-white/20">
                                                <div className="ml-1 text-white"><Package size={40} /></div>
                                                <span className="sr-only">Play</span>
                                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                                            </div>
                                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                                <h2 className="text-2xl font-bold mb-2">{modules[scormModule].title}</h2>
                                                <p className="text-slate-300 line-clamp-2">En este módulo aprenderemos los conceptos fundamentales para aplicar la metodología de manera efectiva.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-8">
                                            <div className="inline-block p-4 rounded-full bg-slate-700/50 mb-4 text-indigo-400">
                                                {modules[scormModule].type === 'quiz' ? <ClipboardCheck size={48} /> : <FileText size={48} />}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Contenido Interactivo</h3>
                                            <p className="text-slate-400 max-w-md mx-auto">Este es un componente de demostración SCORM. En una implementación real, aquí se cargaría el paquete interactivo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="h-16 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-6 shrink-0">
                                <button
                                    onClick={() => setScormModule(Math.max(0, scormModule - 1))}
                                    disabled={scormModule === 0}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition"
                                >
                                    <div className="p-1 rounded-full border border-current"><ArrowRight size={14} className="rotate-180" /></div> Anterior
                                </button>

                                <span className="text-slate-400 text-sm font-medium">
                                    Módulo {scormModule + 1} de {modules.length}
                                </span>

                                <button
                                    onClick={() => setScormModule(Math.min(modules.length - 1, scormModule + 1))}
                                    disabled={scormModule === modules.length - 1}
                                    className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:bg-slate-700 disabled:shadow-none transition"
                                >
                                    Siguiente <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- GESTOR MENTOR TRAINING VIEW (New Module) ---
function GestorMentorTrainingView() {
    const [assignments, setAssignments] = React.useState(MENTOR_ASSIGNMENTS);
    const [showAssignModal, setShowAssignModal] = React.useState(false);
    const [newAssignment, setNewAssignment] = React.useState({ mentorId: '', courseId: '' });

    const handleAssign = () => {
        if (!newAssignment.mentorId || !newAssignment.courseId) return;

        const mentorName = AVAILABLE_MENTORS.find(m => m.id === newAssignment.mentorId)?.name || "Unknown";
        const courseTitle = MENTOR_TRAINING.find(c => c.id === parseInt(newAssignment.courseId))?.title || "Unknown";

        const newItem: any = {
            id: assignments.length + 1,
            mentorId: parseInt(newAssignment.mentorId),
            mentorName: mentorName,
            courseId: parseInt(newAssignment.courseId),
            courseTitle: courseTitle,
            assignedDate: new Date().toISOString().split('T')[0],
            status: "Not Started",
            progress: 0,
            lastAccess: "-"
        };

        setAssignments([...assignments, newItem]);
        setShowAssignModal(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                        <Book size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Gestión de Formación</h2>
                        <p className="text-slate-500">Asigna cursos y monitorea el avance de tus mentores.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                    <Plus size={20} /> Asignar Curso
                </button>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Mentor</th>
                                <th className="p-4 font-bold">Curso Asignado</th>
                                <th className="p-4 font-bold">Fecha Asignación</th>
                                <th className="p-4 font-bold text-center">Progreso</th>
                                <th className="p-4 font-bold text-center">Estado</th>
                                <th className="p-4 font-bold text-center">Último Acceso</th>
                                <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{item.mentorName}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 font-medium">{item.courseTitle}</td>
                                    <td className="p-4 text-slate-500 text-sm">{item.assignedDate}</td>
                                    <td className="p-4 text-center">
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${item.progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">{item.progress}%</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={clsx(
                                            "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                            item.status === 'Completed' ? "bg-green-100 text-green-700" :
                                                item.status === 'In Progress' ? "bg-amber-100 text-amber-700" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-sm text-slate-500">{item.lastAccess || '-'}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Ver Detalles</button>
                                    </td>
                                </tr>
                            ))}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">No hay asignaciones registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Asignar Curso a Mentor</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Mentor</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                                    value={newAssignment.mentorId}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, mentorId: e.target.value })}
                                >
                                    <option value="">Selecciona un mentor...</option>
                                    {AVAILABLE_MENTORS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Curso</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                                    value={newAssignment.courseId}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, courseId: e.target.value })}
                                >
                                    <option value="">Selecciona un curso...</option>
                                    {MENTOR_TRAINING.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!newAssignment.mentorId || !newAssignment.courseId}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Asignar Ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
