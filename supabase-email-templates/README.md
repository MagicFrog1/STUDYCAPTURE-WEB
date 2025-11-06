# 📧 Templates de Email para Supabase

Esta carpeta contiene todos los templates de email profesionales para StudyCaptures.

## 📁 Archivos Disponibles

### 1. **Confirmación de Email** (`../supabase-email-confirmation-template.html`)
**Cuándo se usa:** Cuando un usuario se registra por primera vez
**Asunto sugerido:** `✨ Confirma tu cuenta en StudyCaptures`

### 2. **Magic Link** (`magic-link.html`)
**Cuándo se usa:** Login sin contraseña (passwordless)
**Asunto sugerido:** `🔐 Tu enlace de acceso a StudyCaptures`

### 3. **Reset Password** (`reset-password.html`)
**Cuándo se usa:** Cuando el usuario olvida su contraseña
**Asunto sugerido:** `🔑 Restablece tu contraseña en StudyCaptures`

### 4. **Change Email** (`change-email.html`)
**Cuándo se usa:** Cuando el usuario cambia su dirección de email
**Asunto sugerido:** `📧 Confirma tu nuevo email en StudyCaptures`

## 🎨 Características de los Templates

✅ Diseño responsive (móvil y desktop)
✅ Compatible con todos los clientes de email
✅ Incluye el nuevo logo de StudyCaptures
✅ Colores de marca (gradiente púrpura-rosa-azul)
✅ Botones con call-to-action claros
✅ Enlace alternativo por si el botón no funciona
✅ Mensajes de seguridad
✅ Footer con enlaces a políticas

## 🚀 Cómo Usar

1. Ve al [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Email Templates**
4. Para cada tipo de email:
   - Selecciona el template (Confirm signup, Magic Link, etc.)
   - Copia el contenido del archivo HTML correspondiente
   - Pégalo en el campo "HTML Body"
   - Configura el asunto del email
   - Haz clic en **Save**

## 📋 Variables de Supabase

Estos templates usan las siguientes variables de Supabase:

- `{{ .ConfirmationURL }}` - URL completa con el token
- `{{ .SiteURL }}` - URL de tu sitio web
- `{{ .Token }}` - Token de confirmación
- `{{ .Email }}` - Email del usuario

⚠️ **No modifiques estas variables**, Supabase las reemplaza automáticamente.

## 🎯 Configuración Recomendada

### Site URL (Production)
```
https://studycaptureai.com
```

### Redirect URLs
```
https://studycaptureai.com/**
http://localhost:3000/**
```

### SMTP Recomendado

**Para Producción:**
- **SendGrid** (100 emails/día gratis)
- **Resend** (100 emails/día gratis, más moderno)

**Para Testing:**
- SMTP de Supabase (incluido, limitado)

## ✅ Checklist de Configuración

- [ ] Configurar Site URL en Supabase
- [ ] Configurar Redirect URLs
- [ ] Subir template de confirmación de email
- [ ] Subir template de magic link (opcional)
- [ ] Subir template de reset password
- [ ] Subir template de change email (opcional)
- [ ] Configurar SMTP
- [ ] Probar cada tipo de email
- [ ] Verificar que el logo aparece correctamente

## 📖 Documentación Completa

Revisa `CONFIGURAR_EMAIL_SUPABASE.md` en la raíz del proyecto para instrucciones detalladas paso a paso.

---

**¿Necesitas ayuda?** Revisa la [documentación oficial de Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)

