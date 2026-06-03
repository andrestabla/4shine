import type { PoolClient } from 'pg';

/**
 * Promueve un usuario con `primary_role = 'invitado'` a `lider` sin suscripción,
 * y registra la compra puntual del producto `discovery_4shine` para que el
 * sistema de access lo siga considerando con acceso a Descubrimiento.
 *
 * Nunca duplica usuarios: opera sobre el `userId` recibido. Idempotente —
 * llamarlo varias veces sobre el mismo usuario no crea filas extra.
 *
 * Debe llamarse dentro de la misma transacción que el login (después de
 * verificar credenciales) para mantener atomicidad.
 */
export async function promoteInvitadoToLider(
  client: PoolClient,
  userId: string,
): Promise<void> {
  // 1. Cambiar el rol primario.
  await client.query(
    `UPDATE app_core.users
     SET primary_role = 'lider', updated_at = now()
     WHERE user_id = $1`,
    [userId],
  );

  // 2. Marcar el rol previo como no-default y asegurar 'lider' como default.
  await client.query(
    `UPDATE app_auth.user_roles
     SET is_default = false
     WHERE user_id = $1 AND role_code <> 'lider'`,
    [userId],
  );

  await client.query(
    `INSERT INTO app_auth.user_roles (user_id, role_code, is_default, assigned_by)
     VALUES ($1::uuid, 'lider', true, NULL)
     ON CONFLICT (user_id, role_code) DO UPDATE
     SET is_default = true, assigned_at = now()`,
    [userId],
  );

  // 3. Registrar la compra puntual de discovery_4shine si aún no existe.
  // Esto garantiza que `viewerAccess.canAccessDescubrimiento` siga true
  // después de la promoción (sin esto, perdería acceso por no tener
  // suscripción ni compra de programa).
  await client.query(
    `INSERT INTO app_billing.user_purchases (
       user_id,
       product_code,
       status,
       quantity,
       unit_price_amount,
       currency_code,
       metadata,
       purchased_at,
       activated_at
     )
     SELECT
       $1::uuid,
       'discovery_4shine',
       'active',
       1,
       COALESCE(pc.price_amount, 50),
       COALESCE(pc.currency_code, 'USD'),
       jsonb_build_object('source', 'invitado_promotion'),
       now(),
       now()
     FROM app_billing.product_catalog pc
     WHERE pc.product_code = 'discovery_4shine'
       AND NOT EXISTS (
         SELECT 1
         FROM app_billing.user_purchases up
         WHERE up.user_id = $1::uuid
           AND up.product_code = 'discovery_4shine'
           AND up.status = 'active'
       )`,
    [userId],
  );
}
