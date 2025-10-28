# Pasos para Configurar Supabase Correctamente

## ✅ Ya Tienes Configurado (Correcto)
- RLS policies en `subscriptions` ✅
- Redirect URLs con wildcards ✅

## ⚠️ Necesitas Corregir

### 1. Site URL - QUITAR BARRA FINAL

**Actual (INCORRECTO):**
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/
```

**Debe ser (SIN barra):**
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app
```

**Cómo cambiarlo:**
1. Ve a Supabase Dashboard → Settings → Authentication → URL Configuration
2. En "Site URL" QUITA la barra final (/)
3. Click "Save changes"

### 2. Añadir Redirect URLs para Localhost

**Añade estas 4 URLs:**
```
http://localhost:3000
http://localhost:3000/**
http://localhost:3000/generar
http://localhost:3000/login
```

**Cómo añadirlas:**
1. En "Redirect URLs" click "Add URL"
2. Pega cada una de las 4 URLs
3. Guarda

### 3. Opcional - Añadir URLs Específicas para Vercel

Para mejor compatibilidad, también añade:
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/generar
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/login
```

## 📋 Configuración Final Debería Verse Así

### Site URL:
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app
```

### Redirect URLs (deberías tener ~10 URLs):
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/**
https://studycapture-*-web-angels-projects-79e1aa9b.vercel.app
https://studycapture-*-web-angels-projects-79e1aa9b.vercel.app/**
http://localhost:3000
http://localhost:3000/**
http://localhost:3000/generar
http://localhost:3000/login
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/generar
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/login
```

## 🎯 Después de Cambiar

1. **Guarda los cambios en Supabase**
2. **Prueba en tu dominio de Vercel**
3. **Si sigue dando error, verifica los logs en Supabase Dashboard → Logs → Auth logs**

## ⚠️ Nota Importante

El error 400 en Vercel probablemente es porque el Site URL tiene la barra final. 
**Supabase es muy estricto con las URLs** y una barra extra puede causar que rechace las requests.

