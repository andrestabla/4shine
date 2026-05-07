'use client';

import React from 'react';
import { FileText, Loader2, Save } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';

interface PolicyData {
  version: string;
  content: string;
}

const DEFAULT_VERSION = '2026-05-07';

const DEFAULT_CONTENT = `La presente Política de Privacidad y Tratamiento de Datos Personales regula la recolección, almacenamiento, uso, circulación y protección de la información suministrada por los usuarios de 4Shine — Plataforma de Desarrollo de Equipos. El uso de la Plataforma implica la aceptación de las condiciones aquí descritas.

1. Responsable del tratamiento de datos

La administración de 4Shine es responsable del tratamiento de los datos personales recopilados a través de la plataforma, de conformidad con la normativa vigente sobre protección de datos personales aplicable en cada jurisdicción. Para consultas, solicitudes o reclamos relacionados con el tratamiento de datos personales, los usuarios podrán comunicarse a través de soporte@4shine.co.

2. Información que se recopila

La Plataforma podrá recopilar la siguiente información:

Datos de identificación:
- Nombre y apellidos
- Nombre de usuario

Datos de contacto:
- Correo electrónico
- Número telefónico (cuando aplique)

Información formativa y de equipo:
- Recursos y cursos de aprendizaje inscritos
- Evaluaciones y seguimientos
- Actividades realizadas
- Progreso individual y del equipo
- Certificaciones obtenidas
- Información sobre programas y equipos de trabajo

Datos técnicos y de navegación:
- Dirección IP
- Tipo de dispositivo y navegador
- Registros de acceso
- Cookies y tecnologías similares

Contenido generado por el usuario:
- Comentarios
- Archivos cargados en la plataforma
- Actividades y tareas completadas

3. Finalidad del tratamiento de datos

Los datos personales serán utilizados para:
- Gestionar el acceso y funcionamiento de la plataforma.
- Administrar procesos formativos y de desarrollo de equipos.
- Personalizar la experiencia de aprendizaje.
- Realizar seguimiento al progreso individual y colectivo.
- Generar reportes y estadísticas de desempeño.
- Facilitar procesos de evaluación y certificación.
- Brindar soporte técnico y atención al usuario.
- Enviar comunicaciones institucionales o formativas.
- Mejorar los servicios y funcionalidades de la plataforma.
- Garantizar la seguridad y prevenir usos no autorizados.

La plataforma no comercializará datos personales con terceros sin autorización expresa del titular, salvo obligación legal.

4. Base legal y autorización

El tratamiento de los datos personales se realizará con base en:
- La autorización otorgada por el titular.
- La ejecución de la relación formativa o contractual.
- El cumplimiento de obligaciones legales y regulatorias.
- El interés legítimo relacionado con la prestación segura y eficiente del servicio.

Cuando el usuario registre información en la plataforma, se entenderá que autoriza el tratamiento de sus datos conforme a esta política.

5. Uso de cookies y tecnologías similares

La plataforma podrá utilizar cookies y herramientas de análisis para mantener sesiones activas, recordar preferencias del usuario, analizar el uso de la plataforma y mejorar el rendimiento y la experiencia de navegación. El usuario podrá configurar su navegador para rechazar cookies; sin embargo, algunas funcionalidades podrían verse afectadas.

6. Compartición de información

La información podrá compartirse únicamente en los siguientes casos:
- Con proveedores tecnológicos que apoyen la operación de la plataforma.
- Con organizaciones vinculadas al proceso formativo.
- Por requerimiento de autoridades competentes.
- Cuando exista autorización expresa del titular.

En todos los casos se adoptarán medidas razonables de confidencialidad y seguridad.

7. Conservación de la información

Los datos personales serán conservados durante el tiempo necesario para cumplir las finalidades descritas en esta política, así como las obligaciones legales, administrativas y de auditoría aplicables.

8. Derechos de los titulares

Los usuarios podrán ejercer los siguientes derechos:
- Conocer los datos personales almacenados.
- Solicitar actualización o corrección de información.
- Solicitar la eliminación de datos cuando sea procedente.
- Revocar la autorización otorgada.
- Solicitar prueba de la autorización.
- Presentar consultas o reclamos relacionados con el tratamiento de datos.

Las solicitudes serán atendidas a través de soporte@4shine.co dentro de los términos establecidos por la normativa aplicable.

9. Seguridad de la información

La plataforma implementa medidas técnicas, administrativas y organizacionales razonables para proteger la información contra acceso no autorizado, pérdida, alteración, divulgación y uso indebido. No obstante, ningún sistema es completamente infalible; por ello, el usuario reconoce los riesgos inherentes al uso de servicios digitales.

10. Protección de datos de menores de edad

Cuando la plataforma sea utilizada por menores de edad, el tratamiento de datos personales deberá contar con la autorización de padres, madres, acudientes o representantes legales, según la legislación aplicable. La información de menores será utilizada exclusivamente para fines formativos y de acompañamiento pedagógico.

11. Transferencia internacional de datos

En caso de utilizar servicios tecnológicos ubicados fuera del país de residencia del usuario, la plataforma podrá transferir información a servidores internacionales garantizando niveles adecuados de protección y cumplimiento normativo.

12. Modificaciones a la política

La plataforma podrá actualizar esta Política de Privacidad y Tratamiento de Datos en cualquier momento. Las modificaciones serán publicadas oportunamente y entrarán en vigencia desde su publicación.

13. Aceptación de la política

El uso de la plataforma implica que el usuario ha leído, comprendido y aceptado las condiciones establecidas en la presente Política de Privacidad y Tratamiento de Datos Personales.`;

export default function PoliticasPage() {
  const { can } = useUser();
  const { alert } = useAppDialog();
  const [policy, setPolicy] = React.useState<PolicyData>({ version: DEFAULT_VERSION, content: DEFAULT_CONTENT });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/v1/modules/administracion/politicas', { credentials: 'include' });
        const data = (await res.json()) as { ok: boolean; wizardData: Record<string, string> | null };
        if (data.ok && data.wizardData?.content) {
          setPolicy({ version: data.wizardData.version ?? DEFAULT_VERSION, content: data.wizardData.content });
        }
      } catch {
        // keep defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/modules/administracion/politicas', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Error al guardar');
      setIsDirty(false);
      await alert({ title: 'Política guardada', message: 'El texto de la política fue actualizado correctamente.', tone: 'success' });
    } catch (error) {
      await alert({ title: 'Error', message: error instanceof Error ? error.message : 'No se pudo guardar', tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = can('usuarios', 'manage');

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Política de Privacidad"
          subtitle="Edita el texto que los usuarios deben aceptar antes de ingresar a la plataforma."
        />
        {canEdit && (
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={() => void handleSave()}
            className="app-button-primary shrink-0"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="app-panel p-6 flex items-center gap-3 text-[var(--app-muted)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando política...</span>
        </div>
      ) : (
        <div className="app-panel p-5 space-y-4">
          <div>
            <label className="app-field-label">Fecha de versión</label>
            <input
              type="text"
              className="app-input mt-1 max-w-xs"
              placeholder="YYYY-MM-DD"
              value={policy.version}
              readOnly={!canEdit}
              onChange={(e) => { setPolicy((p) => ({ ...p, version: e.target.value })); setIsDirty(true); }}
            />
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Se mostrará como "Fecha de actualización" en la política.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-[var(--app-muted)]" />
              <label className="app-field-label mb-0">Contenido de la política</label>
            </div>
            <p className="text-xs text-[var(--app-muted)] mb-2">
              Usa líneas en blanco para separar secciones. Las secciones numeradas (ej. "1. Título") se mostrarán en negrita. Las líneas que empiecen con "-" se muestran como lista.
            </p>
            <textarea
              className="w-full rounded-[1rem] border border-[var(--app-border)] bg-white/92 px-4 py-3 text-sm text-[var(--app-ink)] outline-none focus:border-[var(--app-accent)] resize-y font-mono leading-relaxed"
              rows={32}
              value={policy.content}
              readOnly={!canEdit}
              onChange={(e) => { setPolicy((p) => ({ ...p, content: e.target.value })); setIsDirty(true); }}
              placeholder="Escribe aquí el texto de la política..."
            />
          </div>

          {isDirty && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
              Tienes cambios sin guardar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
