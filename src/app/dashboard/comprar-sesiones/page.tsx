'use client';

// Módulo independiente "Comprar sesiones": la compra de sesiones individuales
// con Advisors, antes una pestaña dentro de Mentorías. Reutiliza la vista de
// mentorías forzada a la sección de compra (misma lógica de pago y retorno de
// pasarela vía ?payment=&order=).
import { MentoriasView } from '../mentorias/page';

export default function ComprarSesionesPage() {
  return <MentoriasView forcedSection="comprar" />;
}
