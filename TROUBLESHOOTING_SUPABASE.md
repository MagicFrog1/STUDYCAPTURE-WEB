# Guía de Solución de Problemas - Error 400 con Supabase en Vercel

## Problema
Recibes error 400 al intentar usar las funcionalidades de la aplicación integradas con Supabase en Vercel.

## Causas Posibles y Soluciones

### 1. Verificar Variables de Entorno en Vercel

#### Paso 1: Accede a tu Dashboard de Vercel
1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**

#### Paso 2: Verifica que existan estas variables
Las siguientes variables DEBEN estar presentes:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Paso 3: Si no están, sincrónalas desde Supabase
1. Ve a tu proyecto Supabase → Settings → API
2. Copia:
   - **Project URL** → esto va en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → esto va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Paso 4: Añade las variables en Vercel
1. En Vercel: Settings → Environment Variables
2. Click en **Add New**
3. Añade cada variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (pega la URL de tu proyecto Supabase)
   - Environments: Production, Preview, Development
4. Repite para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Verificar Integración de Supabase

#### Paso 1: Comprueba la integración
1. En Vercel, ve a tu proyecto → Settings → Integrations
2. Busca **Supabase** en las integraciones conectadas
3. Verifica que esté activa

#### Paso 2: Reconecta si es necesario
1. Click en **Supabase**
2. Si hay botón **Reconnect**, haz click
3. Si no está instalada, haz click en **Browse Integrations** y busca Supabase

### 3. Problema con el Error 400 Específico

El error 400 en `/api/process` puede ocurrir por:

#### Causa: Archivos o opciones no enviados correctamente
- **Solución**: Verifica en el navegador (F12 → Console) que:
  - Los archivos se están adjuntando correctamente
  - No hay errores de JavaScript en el formulario

#### Causa: Variables de entorno no cargadas
- **Solución**: 
  1. Despliega un nuevo deployment después de añadir/actualizar variables
  2. Las variables de entorno NO se cargan automáticamente en deployments existentes

### 4. Forzar Nuevo Deployment

Después de cambiar variables de entorno:

1. **Opción A: Deploy Manual**
   ```bash
   git commit --allow-empty -m "Trigger redeploy with new env vars"
   git push
   ```

2. **Opción B: Desde Vercel**
   - Ve a tu proyecto → Deployments
   - Click en los tres puntos del último deployment
   - Click **Redeploy**

### 5. Verificar Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Click en **Functions** o **Logs**
3. Busca los logs que empiezan con:
   - `=== SUPABASE CONFIGURATION (Server) ===`
   - `=== PROCESS API DEBUG ===`

Estos logs te dirán exactamente qué está fallando:
- Si ves `❌ Missing` en alguna variable de entorno
- El número de archivos enviados
- Si las opciones se recibieron correctamente

### 6. Lista de Verificación Rápida

- [ ] Variables de entorno añadidas en Vercel
- [ ] Integración de Supabase activa en Vercel
- [ ] Nuevo deployment realizado después de cambiar variables
- [ ] Proyecto Supabase está activo y funcionando
- [ ] Usuario autenticado con sesión válida
- [ ] Formulario envía archivos e opciones correctamente

### 7. Contactar Soporte

Si después de todos estos pasos sigue dando error:

1. Copia los logs de Vercel (sección Functions/Logs)
2. Incluye:
   - Error completo
   - Variables de entorno configuradas (sin los valores secretos)
   - Pasos que intentaste

## Configuración Recomendada

### Variables Mínimas Requeridas
```env
# Supabase (requeridas)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Stripe (requeridas para pagos)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app

# OpenAI (requerida para procesamiento de imágenes)
OPENAI_API_KEY=sk-...
```

### Variables Opcionales de Supabase
```env
# No son necesarias para funcionamiento básico
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

## Notas Importantes

1. **NEXT_PUBLIC_*** prefijo hace que las variables sean accesibles desde el navegador
2. **NO** expongas `SUPABASE_SERVICE_ROLE_KEY` en variables `NEXT_PUBLIC_*`
3. Siempre haz redeploy después de cambiar variables de entorno
4. Verifica que tu proyecto Supabase no tenga restricciones de acceso

