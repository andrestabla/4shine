'use client';

// Compatibilidad: "Comprar sesiones" se movió a su propio módulo en
// /dashboard/comprar-sesiones. Se conserva la query (?payment=&order=) porque
// las pasarelas antiguas aún pueden retornar a esta URL.
import React from 'react';

export default function MentoriasComprarLegacyRedirect() {
  React.useEffect(() => {
    window.location.replace('/dashboard/comprar-sesiones' + window.location.search);
  }, []);
  return null;
}
