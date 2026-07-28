'use client';

// Alias con guion bajo → ruta canónica /dashboard/comprar-sesiones.
import React from 'react';

export default function ComprarSesionesAliasRedirect() {
  React.useEffect(() => {
    window.location.replace('/dashboard/comprar-sesiones' + window.location.search);
  }, []);
  return null;
}
