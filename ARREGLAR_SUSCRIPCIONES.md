# 🔧 Arreglar Sistema de Suscripciones

## 📋 Resumen del Problema

Has reportado que después de suscribirte:
1. Las generaciones siguen bloqueadas
2. No aparece el panel de gestión de suscripción

## ✅ Cambios Realizados

He arreglado completamente el sistema de suscripciones:

### 1. **Función `isPremium()` Arreglada** (`src/lib/premium.ts`)
   - Antes: Siempre retornaba `true` (modo testing)
   - Ahora: Verifica correctamente el campo `is_premium` en la tabla `profiles`

### 2. **Página de Perfil Actualizada** (`src/app/profile/page.tsx`)
   - Antes: Buscaba en tabla `subscriptions` (que no existe)
   - Ahora: Lee correctamente de tabla `profiles`
   - Agregado botón para **Portal de Stripe** (gestionar suscripción profesionalmente)

### 3. **Nueva API para Portal de Stripe** (`src/app/api/create-portal-session/route.ts`)
   - Permite gestionar suscripción directamente desde Stripe
   - Cambiar plan, cancelar, actualizar tarjeta, etc.

## 🚀 Pasos para Arreglar Todo

### Paso 1: Verificar Tabla `profiles` en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto
2. Ve a **Table Editor**
3. Busca la tabla `profiles`
4. Verifica que tenga estas columnas:
   ```
   - id (UUID, Primary Key)
   - user_id (UUID, Foreign Key → auth.users)
   - is_premium (BOOLEAN, default false)
   - stripe_customer_id (TEXT, nullable)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
   ```

5. Si la tabla NO existe, créala ejecutando el SQL de `supabase-schema.sql`:

```sql
-- Ve a SQL Editor y ejecuta esto:

CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que webhooks (service role) actualicen perfiles
DROP POLICY IF EXISTS "Service role can update any profile" ON profiles;
CREATE POLICY "Service role can update any profile" ON profiles
  FOR UPDATE USING (true);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Paso 2: Crear Tu Perfil Manualmente (Si No Existe)

Si ya te registraste ANTES de crear la tabla `profiles`:

```sql
-- Ve a SQL Editor y ejecuta:
-- Reemplaza 'tu-email@ejemplo.com' con tu email real

INSERT INTO profiles (user_id, is_premium, stripe_customer_id)
SELECT 
  id,
  false,  -- Cambia a true si ya pagaste
  NULL    -- Se actualizará cuando Stripe procese el webhook
FROM auth.users
WHERE email = 'angeldcchp94@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

### Paso 3: Actualizar Tu Estado Premium (TEMPORAL)

Como ya te suscribiste pero el webhook no actualizó tu perfil:

```sql
-- Ve a SQL Editor y ejecuta:
-- Reemplaza 'tu-email@ejemplo.com' con tu email real

UPDATE profiles
SET is_premium = true, updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com'
);
```

### Paso 4: Configurar Webhook de Stripe

El webhook YA está programado en `/api/webhooks/stripe/route.ts`, pero necesitas configurarlo en Stripe:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://studycaptureai.com/api/webhooks/stripe`
4. **Events to send**: Selecciona estos eventos:
   ```
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```
5. Click **Add endpoint**
6. Copia el **Signing secret** (empieza con `whsec_...`)
7. Agrégalo a tus variables de entorno:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Paso 5: Habilitar Portal de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com) → **Settings** → **Customer Portal**
2. Activa el portal si no está activado
3. Configura:
   - ✅ **Allow customers to update their payment methods**
   - ✅ **Allow customers to update their billing information**
   - ✅ **Allow customers to cancel subscriptions** (opcional)
   - ✅ **Allow customers to switch plans** (opcional)

### Paso 6: Desplegar Cambios

```bash
git add .
git commit -m "fix: arreglar sistema de suscripciones y verificación premium"
git push origin main
```

Vercel desplegará automáticamente los cambios.

## 🧪 Probar que Funciona

### 1. Verificar Estado Premium en Perfil

1. Inicia sesión en tu cuenta
2. Ve a `/profile`
3. Deberías ver:
   - ✅ **Plan**: "Premium (sin límites)"
   - ✅ Botón **"Gestionar suscripción"**

### 2. Probar Portal de Stripe

1. En `/profile`, click en **"Gestionar suscripción"**
2. Deberías ser redirigido al Portal de Stripe
3. Allí puedes:
   - Ver tu suscripción actual
   - Actualizar tarjeta
   - Ver historial de pagos
   - Cancelar suscripción

### 3. Probar Generaciones

1. Ve a `/generar`
2. Sube una imagen
3. Deberías poder generar sin límites

## 🐛 Troubleshooting

### Problema: "Las generaciones siguen bloqueadas"

**Solución 1:** Verifica que tu perfil tenga `is_premium = true`:

```sql
-- SQL Editor en Supabase:
SELECT user_id, is_premium, stripe_customer_id, updated_at
FROM profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
```

Si `is_premium = false`, actualízalo manualmente (Paso 3).

**Solución 2:** Limpia la caché del navegador:
- Ctrl + Shift + R (Windows/Linux)
- Cmd + Shift + R (Mac)

**Solución 3:** Cierra sesión y vuelve a iniciar sesión

### Problema: "No aparece botón de Gestionar Suscripción"

**Causa:** Tu perfil tiene `is_premium = false`

**Solución:** Ejecuta el SQL del Paso 3 para actualizar manualmente.

### Problema: "Error al abrir portal de suscripción"

**Causa 1:** No tienes `stripe_customer_id` en tu perfil

```sql
-- Verificar:
SELECT stripe_customer_id FROM profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
```

Si es `NULL`, necesitas:
1. Buscar tu Customer ID en Stripe Dashboard
2. Actualizarlo manualmente:

```sql
UPDATE profiles
SET stripe_customer_id = 'cus_xxxxxxxxxxxxx'  -- Tu Customer ID de Stripe
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
```

**Causa 2:** Portal de Stripe no está habilitado (ver Paso 5)

### Problema: "Nuevos usuarios no pueden suscribirse"

**Causa:** El webhook no está configurado o la función trigger no se ejecutó.

**Solución:**
1. Configurar webhook (Paso 4)
2. Verificar que el trigger `on_auth_user_created` existe (Paso 1)

## 📊 Verificar Sistema Completo

Ejecuta este SQL para ver el estado de todos los usuarios:

```sql
SELECT 
  u.email,
  p.is_premium,
  p.stripe_customer_id,
  p.updated_at as last_update
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;
```

## ✅ Checklist Final

- [ ] Tabla `profiles` existe con todas las columnas
- [ ] Perfil creado para tu usuario
- [ ] Campo `is_premium = true` para tu usuario
- [ ] Campo `stripe_customer_id` tiene valor (si ya pagaste)
- [ ] Webhook configurado en Stripe
- [ ] Portal de Stripe habilitado
- [ ] Variables de entorno actualizadas
- [ ] Cambios desplegados en Vercel
- [ ] Probado en el sitio web
- [ ] Las generaciones funcionan sin límites

## 🆘 Si Nada Funciona

1. **Verifica los logs de Supabase:**
   - Dashboard → Logs → Postgres Logs

2. **Verifica los logs de Vercel:**
   - Dashboard → Tu proyecto → Logs

3. **Verifica los logs de Stripe:**
   - Dashboard → Developers → Webhooks → [Tu endpoint] → Recent Events

4. **Contacta con tu perfil específico:**
   Envíame tu email (el que usaste para registrarte) y revisaré la base de datos.

---

¡Una vez completados estos pasos, el sistema de suscripciones debería funcionar perfectamente! 🎉

