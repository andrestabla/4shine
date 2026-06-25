// Compatibilidad de URL: /advisers fue renombrado a /advisors al cambiar la
// nomenclatura de "Adviser" a "Advisor" en toda la plataforma. Esta página
// existe únicamente para que enlaces externos viejos (marketing, redes,
// emails ya enviados) sigan funcionando con un 308 permanent redirect.
import { redirect } from 'next/navigation';

export default function AdvisersLegacyRedirect() {
  redirect('/advisors');
}
