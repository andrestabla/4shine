/**
 * Política de contraseñas única para registro, restablecimiento y cambio.
 *
 * El registro no validaba nada: aceptaba una contraseña de un solo carácter,
 * mientras que reset y cambio ya exigían 8. Cuentas así caen con las veinte
 * contraseñas más probadas, y el bloqueo por intentos ayuda poco cuando el
 * ataque se reparte entre muchas cuentas.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Las más usadas en ataques de diccionario, en inglés y español. */
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123',
  'qwerty123', 'qwertyui', 'iloveyou', 'admin123', 'welcome1', 'abc12345',
  'contrasena', 'contraseña', '11111111', '00000000', 'colombia', 'liderazgo',
  '4shine', '4shine123', 'bienvenido', 'usuario1',
]);

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

export function validatePassword(password: unknown): PasswordCheck {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, error: 'La contraseña es obligatoria' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` };
  }
  const normalized = password.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    return { ok: false, error: 'Esa contraseña es demasiado común. Elige una diferente.' };
  }
  // Un solo carácter repetido ("aaaaaaaa") pasa el mínimo de longitud pero no
  // aporta entropía alguna.
  if (new Set(normalized).size <= 2) {
    return { ok: false, error: 'La contraseña es demasiado simple. Combina más caracteres.' };
  }
  return { ok: true };
}
