import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

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

const DEFAULT_VERSION = '2026-05-07';

export async function GET() {
  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);
        const { rows } = await client.query<{ wizard_data: Record<string, string> | null }>(
          `SELECT wizard_data
           FROM app_admin.integration_configs
           WHERE integration_key = 'privacy_policy'
           LIMIT 1`,
        );
        await client.query('COMMIT');
        const row = rows[0];
        if (row?.wizard_data?.content) {
          return { version: row.wizard_data.version ?? DEFAULT_VERSION, content: row.wizard_data.content };
        }
        return { version: DEFAULT_VERSION, content: DEFAULT_CONTENT };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch {
    return NextResponse.json({ version: DEFAULT_VERSION, content: DEFAULT_CONTENT });
  }
}
