# Cómo Configurar Tu Dominio Personalizado

## 🎯 Objetivo
Hacer que tu aplicación use tu dominio personalizado (ej: `studycapture.com`) en lugar de `https://studycapture-web-angels-projects-79e1aa9b.vercel.app`

## 📋 Paso 1: Configurar Dominio en Vercel

### 1.1 Ve a Vercel
1. Abre: https://vercel.com/dashboard
2. Selecciona tu proyecto "apuntes-ia"
3. Click en **Settings** → **Domains**

### 1.2 Añade tu Dominio
1. En el campo "Add domain", escribe tu dominio (ej: `studycapture.com`)
2. Click **Add**
3. Verás instrucciones de DNS que debes configurar

### 1.3 Configura DNS en tu Registrar
Vercel te mostrará algo como:
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www      cname.vercel-dns.com
```

**Cómo configurarlo:**
1. Ve a donde compraste tu dominio (GoDaddy, Namecheap, etc.)
2. Busca la sección "DNS Management" o "Zone Records"
3. Añade los registros que Vercel te muestra
4. Guarda los cambios
5. Espera 5-30 minutos para que se propaguen

### 1.4 Verifica Estado
En Vercel → Settings → Domains verás:
- ✅ "Valid Configuration" → Listo
- ⏳ "Validating" → Espera unos minutos
- ❌ "Invalid Configuration" → Revisa los registros DNS

## 📋 Paso 2: Actualizar URLs en Supabase

### 2.1 Ve a Supabase
1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto "CAPTURESTUDIO"
3. Ve a **Settings** → **Authentication** → **URL Configuration**

### 2.2 Actualiza Site URL
**Cambia de:**
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app
```

**A tu dominio personalizado:**
```
https://studycapture.com
```

⚠️ **SIN barra final**

### 2.3 Añade Redirect URLs
Borras las antiguas y añades estas:

**Para tu dominio personalizado:**
```
https://studycapture.com
https://studycapture.com/**
https://studycapture.com/generar
https://studycapture.com/login
```

**Para desarrollo local:**
```
http://localhost:3000
http://localhost:3000/**
http://localhost:3000/generar
http://localhost:3000/login
```

**Opción: Si quieres mantener el dominio de Vercel también:**
```
https://studycapture-web-angels-projects-79e1aa9b.vercel.app
https://studycapture-web-angels-projects-79e1aa9b.vercel.app/**
```

### 2.4 Guarda Cambios
Click en **Save changes**

## 📋 Paso 3: Verificar que Funciona

### 3.1 Prueba tu Dominio
1. Ve a `https://tu-dominio.com` en el navegador
2. Debería cargar tu aplicación
3. Intenta hacer login

### 3.2 Verifica en DevTools
1. Abre DevTools (F12)
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Revisa que las llamadas a Supabase usen tu dominio

## 🔍 Solución de Problemas

### Problema: "Invalid DNS Configuration"
**Solución:**
- Revisa que los registros DNS estén correctos
- Espera más tiempo (DNS puede tardar hasta 24 horas)
- Usa herramientas como `nslookup` o `dig` para verificar

### Problema: "Domain not verified"
**Solución:**
- Asegúrate de haber configurado todos los registros
- Espera unos minutos
- Click en "Refresh" en Vercel

### Problema: Still using .vercel.app
**Solución:**
- Ve a tu dominio personalizado directamente
- Limpia cache del navegador
- Verifica que en Vercel muestre "Valid Configuration"

### Problema: Error 400 después de cambiar dominio
**Solución:**
1. Verifica que el Site URL en Supabase coincida EXACTAMENTE con tu dominio
2. Asegúrate de NO tener barra final
3. Verifica que todas las Redirect URLs estén configuradas
4. Limpia localStorage en el navegador:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## ✅ Checklist Final

- [ ] Dominio añadido en Vercel
- [ ] DNS configurado en tu registrar
- [ ] Vercel muestra "Valid Configuration"
- [ ] Site URL actualizado en Supabase (SIN barra final)
- [ ] Redirect URLs actualizadas en Supabase
- [ ] Probado acceso con dominio personalizado
- [ ] Login funciona correctamente

## 💡 Nota Importante

**Puedes usar ambos dominios simultáneamente:**
- Tu dominio personalizado (ej: `studycapture.com`) → para usuarios
- El dominio de Vercel (ej: `...vercel.app`) → para preview deployments

Solo asegúrate de añadir ambos a las Redirect URLs en Supabase.

