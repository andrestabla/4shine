'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onAccept: () => Promise<void>;
}

const SECTIONS = [
  {
    title: '1. Responsable del tratamiento de datos',
    body: 'La administración de 4Shine es responsable del tratamiento de los datos personales recopilados a través de la plataforma, de conformidad con la normativa vigente sobre protección de datos personales aplicable en cada jurisdicción. Para consultas, solicitudes o reclamos relacionados con el tratamiento de datos personales, los usuarios podrán comunicarse a través de soporte@4shine.co.',
  },
  {
    title: '2. Información que se recopila',
    body: null,
    list: [
      { subtitle: 'Datos de identificación', items: ['Nombre y apellidos', 'Nombre de usuario'] },
      { subtitle: 'Datos de contacto', items: ['Correo electrónico', 'Número telefónico (cuando aplique)'] },
      {
        subtitle: 'Información formativa y de equipo',
        items: [
          'Recursos y cursos de aprendizaje inscritos',
          'Evaluaciones y seguimientos',
          'Actividades realizadas',
          'Progreso individual y del equipo',
          'Certificaciones obtenidas',
          'Información sobre programas y equipos de trabajo',
        ],
      },
      {
        subtitle: 'Datos técnicos y de navegación',
        items: ['Dirección IP', 'Tipo de dispositivo y navegador', 'Registros de acceso', 'Cookies y tecnologías similares'],
      },
      {
        subtitle: 'Contenido generado por el usuario',
        items: ['Comentarios', 'Archivos cargados en la plataforma', 'Actividades y tareas completadas'],
      },
    ],
  },
  {
    title: '3. Finalidad del tratamiento de datos',
    body: 'Los datos personales serán utilizados para:',
    list: [
      {
        subtitle: null,
        items: [
          'Gestionar el acceso y funcionamiento de la plataforma.',
          'Administrar procesos formativos y de desarrollo de equipos.',
          'Personalizar la experiencia de aprendizaje.',
          'Realizar seguimiento al progreso individual y colectivo.',
          'Generar reportes y estadísticas de desempeño.',
          'Facilitar procesos de evaluación y certificación.',
          'Brindar soporte técnico y atención al usuario.',
          'Enviar comunicaciones institucionales o formativas.',
          'Mejorar los servicios y funcionalidades de la plataforma.',
          'Garantizar la seguridad y prevenir usos no autorizados.',
        ],
      },
    ],
    footer: 'La plataforma no comercializará datos personales con terceros sin autorización expresa del titular, salvo obligación legal.',
  },
  {
    title: '4. Base legal y autorización',
    body: 'El tratamiento de los datos personales se realizará con base en:',
    list: [
      {
        subtitle: null,
        items: [
          'La autorización otorgada por el titular.',
          'La ejecución de la relación formativa o contractual.',
          'El cumplimiento de obligaciones legales y regulatorias.',
          'El interés legítimo relacionado con la prestación segura y eficiente del servicio.',
        ],
      },
    ],
    footer: 'Cuando el usuario registre información en la plataforma, se entenderá que autoriza el tratamiento de sus datos conforme a esta política.',
  },
  {
    title: '5. Uso de cookies y tecnologías similares',
    body: 'La plataforma podrá utilizar cookies y herramientas de análisis para mantener sesiones activas, recordar preferencias del usuario, analizar el uso de la plataforma y mejorar el rendimiento y la experiencia de navegación. El usuario podrá configurar su navegador para rechazar cookies; sin embargo, algunas funcionalidades podrían verse afectadas.',
  },
  {
    title: '6. Compartición de información',
    body: 'La información podrá compartirse únicamente en los siguientes casos:',
    list: [
      {
        subtitle: null,
        items: [
          'Con proveedores tecnológicos que apoyen la operación de la plataforma.',
          'Con organizaciones vinculadas al proceso formativo.',
          'Por requerimiento de autoridades competentes.',
          'Cuando exista autorización expresa del titular.',
        ],
      },
    ],
    footer: 'En todos los casos se adoptarán medidas razonables de confidencialidad y seguridad.',
  },
  {
    title: '7. Conservación de la información',
    body: 'Los datos personales serán conservados durante el tiempo necesario para cumplir las finalidades descritas en esta política, así como las obligaciones legales, administrativas y de auditoría aplicables.',
  },
  {
    title: '8. Derechos de los titulares',
    body: 'Los usuarios podrán ejercer los siguientes derechos:',
    list: [
      {
        subtitle: null,
        items: [
          'Conocer los datos personales almacenados.',
          'Solicitar actualización o corrección de información.',
          'Solicitar la eliminación de datos cuando sea procedente.',
          'Revocar la autorización otorgada.',
          'Solicitar prueba de la autorización.',
          'Presentar consultas o reclamos relacionados con el tratamiento de datos.',
        ],
      },
    ],
    footer: 'Las solicitudes serán atendidas a través de soporte@4shine.co dentro de los términos establecidos por la normativa aplicable.',
  },
  {
    title: '9. Seguridad de la información',
    body: 'La plataforma implementa medidas técnicas, administrativas y organizacionales razonables para proteger la información contra acceso no autorizado, pérdida, alteración, divulgación y uso indebido. No obstante, ningún sistema es completamente infalible; por ello, el usuario reconoce los riesgos inherentes al uso de servicios digitales.',
  },
  {
    title: '10. Protección de datos de menores de edad',
    body: 'Cuando la plataforma sea utilizada por menores de edad, el tratamiento de datos personales deberá contar con la autorización de padres, madres, acudientes o representantes legales, según la legislación aplicable. La información de menores será utilizada exclusivamente para fines formativos y de acompañamiento pedagógico.',
  },
  {
    title: '11. Transferencia internacional de datos',
    body: 'En caso de utilizar servicios tecnológicos ubicados fuera del país de residencia del usuario, la plataforma podrá transferir información a servidores internacionales garantizando niveles adecuados de protección y cumplimiento normativo.',
  },
  {
    title: '12. Modificaciones a la política',
    body: 'La plataforma podrá actualizar esta Política de Privacidad y Tratamiento de Datos en cualquier momento. Las modificaciones serán publicadas oportunamente y entrarán en vigencia desde su publicación.',
  },
  {
    title: '13. Aceptación de la política',
    body: 'El uso de la plataforma implica que el usuario ha leído, comprendido y aceptado las condiciones establecidas en la presente Política de Privacidad y Tratamiento de Datos Personales.',
  },
];

export function PrivacyPolicyModal({ onAccept }: Props) {
  const [checked, setChecked] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAccept = async () => {
    if (!checked || isSaving) return;
    setIsSaving(true);
    try {
      await onAccept();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">4Shine</p>
          <h2 className="text-lg font-bold text-slate-900">Política de Privacidad y Tratamiento de Datos Personales</h2>
          <p className="text-xs text-slate-500 mt-0.5">Fecha de actualización: 7 de mayo de 2026</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-700">
          <p className="leading-relaxed">
            La presente Política de Privacidad y Tratamiento de Datos Personales regula la recolección,
            almacenamiento, uso, circulación y protección de la información suministrada por los usuarios
            de 4Shine — Plataforma de Desarrollo de Equipos (en adelante, &ldquo;la Plataforma&rdquo;).
            El uso de la Plataforma implica la aceptación de las condiciones aquí descritas.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-slate-900 mb-1.5">{section.title}</p>
              {section.body && <p className="leading-relaxed mb-2">{section.body}</p>}
              {'list' in section && section.list && (
                <ul className="space-y-2 ml-2">
                  {section.list.map((group, gi) => (
                    <li key={gi}>
                      {group.subtitle && (
                        <p className="font-medium text-slate-800 mb-1">{group.subtitle}</p>
                      )}
                      <ul className="list-disc list-inside space-y-0.5 ml-2 text-slate-600">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              {'footer' in section && section.footer && (
                <p className="mt-2 leading-relaxed text-slate-600 italic">{section.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer / accept area */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 leading-snug">
              He leído y acepto las{' '}
              <strong>Políticas de Privacidad y Tratamiento de Datos Personales</strong>{' '}
              de 4Shine.
            </span>
          </label>
          <button
            type="button"
            disabled={!checked || isSaving}
            onClick={() => void handleAccept()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  );
}
