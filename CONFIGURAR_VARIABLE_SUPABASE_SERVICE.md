# 🔑 Configurar SUPABASE_SERVICE_ROLE_KEY en Vercel

## 📋 Problema Resuelto

El error **401 - No autorizado** al intentar gestionar la suscripción se debe a que falta la variable de entorno `SUPABASE_SERVICE_ROLE_KEY`.

## 🔧 Solución

### Paso 1: Obtener la Service Role Key de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. En la sección **Project API keys**, busca:
   - `service_role` key (NO uses la `anon` key)
5. **Copia** la clave completa (empieza con algo como `eyJhb...`)

⚠️ **IMPORTANTE**: Esta es una clave SECRETA, nunca la compartas ni la subas a GitHub.

### Paso 2: Agregar la Variable en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **SttudyCaptureAI**
3. Ve a **Settings** → **Environment Variables**
4. Click en **Add New**
5. Configura:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [Pega aquí la service_role key que copiaste]
   Environment: Production, Preview, Development (marca las 3)
   ```
6. Click **Save**

### Paso 3: Re-desplegar

Después de agregar la variable, necesitas re-desplegar:

**Opción A: Re-deploy automático (más fácil)**
1. En Vercel Dashboard → Tu proyecto
2. Ve a **Deployments**
3. Click en los 3 puntos `...` del último deployment
4. Click **Redeploy**

**Opción B: Hacer un push**
```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### Paso 4: Verificar

Una vez que el deployment termine (~2 minutos):

1. Ve a tu sitio web
2. Recarga con caché limpio: `Ctrl + Shift + R`
3. Ve a `/profile`
4. Click en **"Gestionar suscripción"**
5. Deberías ser redirigido al Portal de Stripe ✅

## ✅ Variables de Entorno Necesarias

Verifica que tienes TODAS estas variables en Vercel:

```env
# Supabase (públicas)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Supabase (privada - NUEVA)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
STRIPE_SECRET_KEY=sk_live_... o sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... o pk_test_...

# Productos Stripe
STRIPE_PRODUCT_MONTHLY=prod_...
STRIPE_PRODUCT_YEARLY=prod_...

# URLs
NEXT_PUBLIC_BASE_URL=https://studycaptureai.com
```

## 🐛 Troubleshooting

### Error: "Supabase credentials not configured"

**Causa**: La variable `SUPABASE_SERVICE_ROLE_KEY` no está configurada correctamente.

**Solución**:
1. Verifica que la variable existe en Vercel
2. Verifica que está aplicada a "Production"
3. Re-despliega la aplicación

### El Portal de Stripe sigue sin funcionar

1. Verifica que el deployment terminó correctamente
2. Limpia caché del navegador
3. Verifica los logs en Vercel:
   - Dashboard → Tu proyecto → Logs
   - Busca errores relacionados con "create-portal-session"

### Error: "Cliente no encontrado"

**Causa**: El `stripe_customer_id` no está en tu perfil de Supabase.

**Solución**: Ejecuta en Supabase SQL Editor:

```sql
-- Verificar
SELECT stripe_customer_id FROM profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'angeldcchp94@gmail.com');

-- Si es NULL, actualizarlo
UPDATE profiles
SET stripe_customer_id = 'cus_XXXXXXXXXX'  -- Tu Customer ID real de Stripe
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'angeldcchp94@gmail.com');
```

---

## 🎯 Resumen

1. ✅ Obtener Service Role Key de Supabase
2. ✅ Agregarla a Vercel como `SUPABASE_SERVICE_ROLE_KEY`
3. ✅ Re-desplegar la aplicación
4. ✅ Probar gestionar suscripción

¡Una vez hecho esto, el portal de gestión debería funcionar perfectamente! 🎉

