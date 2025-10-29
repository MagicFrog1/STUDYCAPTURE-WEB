# Solución: Funciona en local pero NO en Vercel

## ❌ Problema Actual
- ✅ Funciona en `npm run dev` (localhost)
- ❌ NO funciona en Vercel (producción)
- Error: 400 Bad Request

## ✅ Solución: Configurar Variables de Entorno en Vercel

### Paso 1: Ve a tu Panel de Vercel
1. Abre: https://vercel.com/dashboard
2. Selecciona tu proyecto "apuntes-ia"
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Verifica/Añade estas Variables

Estas variables **DEBEN** estar configuradas en Vercel:

#### Variables OBLIGATORIAS:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

#### Variables Requeridas para Features Específicas:

**Para Procesamiento de Imágenes (IA):**
```env
OPENAI_API_KEY=sk-REPLACE_ME
```

**Para Pagos con Stripe:**
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PRODUCT_MONTHLY=prod_TI4RSiWSI0DT4R
STRIPE_PRODUCT_YEARLY=prod_TI4RRTZhyhpklk
STRIPE_CURRENCY=eur
STRIPE_MONTHLY_UNIT_AMOUNT_CENTS=499
STRIPE_YEARLY_UNIT_AMOUNT_CENTS=3999
```

**Para URL de Redirect:**
```env
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
```

### Paso 3: Cómo Añadir las Variables

Para cada variable:
1. Click en **Add New**
2. Name: (pega el nombre, ej: `NEXT_PUBLIC_SUPABASE_URL`)
3. Value: (pega el valor)
4. Environments: Selecciona **Production**, **Preview**, y **Development**
5. Click **Save**

### Paso 4: Redesplegar

⚠️ **MUY IMPORTANTE**: Después de añadir/modificar variables de entorno, DEBES redesplegar:

**Opción A: Desde Vercel Dashboard**
1. Ve a **Deployments**
2. Click en los tres puntos (⋮) del último deployment
3. Click **Redeploy**

**Opción B: Desde Git**
```bash
git commit --allow-empty -m "Redeploy: New env vars"
git push
```

### Paso 5: Verificar

Después del redeploy:
1. Ve a tu dominio de Vercel
2. Abre las DevTools (F12)
3. Ve a la pestaña **Console**
4. Busca errores relacionados con Supabase
5. Verifica que los logs muestren:
   - `✅ Present` para las variables de Supabase
   - Si ves `❌ Missing` → las variables no están configuradas

### Paso 6: Limpiar Token de Refresh Inválido

Si sigues viendo el error "Invalid Refresh Token":

**En el navegador:**
1. Abre DevTools (F12)
2. Ve a **Application** → **Local Storage**
3. Busca `supabase.auth.token` y elimínalos
4. También verifica **Session Storage**
5. Recarga la página

**O desde la consola:**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 🔍 Diagnóstico

### Cómo verificar si está funcionando:

1. **Verifica los logs en Vercel:**
   - Ve a tu proyecto → **Functions** o **Logs**
   - Busca errores que mencionen "Supabase" o "400"

2. **Prueba localmente:**
   ```bash
   npm run dev
   ```
   - Si funciona localmente pero no en Vercel → problema de variables de entorno
   - Si no funciona en ninguno → problema de código

3. **Crea un `.env.local` local (para desarrollo):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   OPENAI_API_KEY=sk-REPLACE_ME
   ```

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Vercel
- [ ] Todas las variables tienen los tres ambientes seleccionados
- [ ] Nuevo deployment realizado después de cambiar variables
- [ ] `.env.local` creado localmente
- [ ] Token de refresh limpiado en el navegador
- [ ] Pruebas funcionando en producción

## 🆘 Si Aún No Funciona

1. Verifica que tu proyecto Supabase esté activo
2. Verifica que las URLs de redirect estén configuradas en Supabase
3. Revisa los logs de Vercel para errores específicos
4. Comprueba que la integración de Supabase esté activa en Vercel

