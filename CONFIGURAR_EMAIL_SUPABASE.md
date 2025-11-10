# 📧 Configurar Email de Confirmación en Supabase

## 🔑 Variables de Supabase para Templates de Email

Supabase usa estas variables especiales en los templates de email:

- `{{ .ConfirmationURL }}` - URL completa de confirmación de email
- `{{ .Token }}` - Token de confirmación (solo el token)
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL de tu sitio web (configurada en Supabase)
- `{{ .RedirectTo }}` - URL de redirección personalizada
- `{{ .Email }}` - Email del usuario

## 📝 Pasos para Configurar

### 1. Accede al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **SttudyCaptureAI**
3. Ve a **Authentication** → **Email Templates** en el menú lateral

### 2. Configura la URL del Sitio

Antes de configurar los emails, asegúrate de que tu **Site URL** esté correcta:

1. Ve a **Authentication** → **URL Configuration**
2. Configura:
   - **Site URL**: `https://studycaptureai.com` (o tu dominio en producción)
   - Para desarrollo local: `http://localhost:3000`
3. En **Redirect URLs**, agrega:
   ```
   https://studycaptureai.com/**
   http://localhost:3000/**
   ```

### 3. Configura el Email de Confirmación

1. En **Authentication** → **Email Templates**
2. Selecciona **Confirm signup**
3. Configura:
   
   **Subject (Asunto):**
   ```
   ✨ Confirma tu cuenta en StudyCaptures
   ```
   
   **Body (Cuerpo):**
   - Copia TODO el contenido del archivo `supabase-email-confirmation-template.html`
   - Pégalo en el campo **HTML Body**

4. Haz clic en **Save** (Guardar)

### 4. Verifica la Configuración del Remitente

1. Ve a **Project Settings** → **Auth**
2. En la sección **SMTP Settings**:
   - Si usas el SMTP de Supabase (gratis, limitado):
     - **From Email**: `noreply@mail.app.supabase.io` (se configura automáticamente)
   
   - Si quieres usar tu propio SMTP (recomendado para producción):
     - Activa **Enable Custom SMTP**
     - Configura tu servidor SMTP (ejemplo con Gmail o SendGrid)

### 5. Configura SMTP Personalizado (Opcional pero Recomendado)

#### Opción A: Gmail (para desarrollo/testing)

⚠️ **Importante**: Gmail tiene límite de 500 emails/día

1. En tu cuenta de Google, activa la **Verificación en 2 pasos**
2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Genera una **Contraseña de aplicación** para "Mail"
4. En Supabase SMTP Settings:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: tu-email@gmail.com
   Password: [contraseña de aplicación generada]
   Sender email: tu-email@gmail.com
   Sender name: StudyCaptures
   ```

#### Opción B: SendGrid (Recomendado para producción)

1. Crea cuenta en [sendgrid.com](https://sendgrid.com) (100 emails/día gratis)
2. Verifica tu dominio o email
3. Genera una API Key
4. En Supabase SMTP Settings:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [tu SendGrid API key]
   Sender email: noreply@studycaptureai.com
   Sender name: StudyCaptures
   ```

#### Opción C: Resend (Moderno y fácil)

1. Crea cuenta en [resend.com](https://resend.com) (100 emails/día gratis)
2. Verifica tu dominio
3. Genera una API Key
4. En Supabase SMTP Settings:
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [tu Resend API key]
   Sender email: noreply@studycaptureai.com
   Sender name: StudyCaptures
   ```

### 6. Prueba el Email

1. Cierra sesión en tu app si estás logueado
2. Ve a `/login` y crea una cuenta de prueba con un email real tuyo
3. Revisa tu bandeja de entrada (y spam)
4. El email debería verse con tu diseño personalizado
5. Haz clic en el botón de confirmación

## 🎨 Personalización Adicional

### Otros Templates de Email que puedes personalizar:

#### 1. **Magic Link** (Login sin contraseña)
- Subject: `🔐 Tu enlace de acceso a StudyCaptures`
- Variable: `{{ .ConfirmationURL }}`

#### 2. **Reset Password** (Recuperar contraseña)
- Subject: `🔑 Restablece tu contraseña en StudyCaptures`
- Variable: `{{ .ConfirmationURL }}`

#### 3. **Change Email** (Cambiar email)
- Subject: `📧 Confirma tu nuevo email en StudyCaptures`
- Variable: `{{ .ConfirmationURL }}`

## 🚀 Variables de Entorno en tu App

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# URL del sitio (debe coincidir con Supabase Site URL)
NEXT_PUBLIC_SITE_URL=https://studycaptureai.com
```

## ✅ Checklist Final

- [ ] Site URL configurada correctamente en Supabase
- [ ] Redirect URLs configuradas
- [ ] Template de email copiado y guardado
- [ ] SMTP configurado (Supabase o personalizado)
- [ ] Email de prueba enviado y recibido correctamente
- [ ] Botón de confirmación funciona
- [ ] Logo aparece correctamente en el email
- [ ] Email se ve bien en móvil y desktop

## 📧 Correo de Contacto

Los templates incluyen el correo de contacto **studycapturesai@gmail.com** en el footer. Asegúrate de:
- Tener acceso a este correo
- Revisar regularmente las consultas de usuarios
- Configurar respuestas automáticas si es necesario

## 🐛 Troubleshooting

### El email no llega:
1. Revisa la carpeta de spam
2. Verifica que el SMTP esté configurado correctamente
3. Revisa los logs en Supabase Dashboard → Logs → Auth Logs
4. Si usas Gmail, verifica que no hayas superado el límite diario

### El logo no aparece:
1. Asegúrate de que `{{ .SiteURL }}` esté configurada correctamente
2. El archivo `LOGO WEB.png` debe estar accesible públicamente en `/LOGO%20WEB.png`
3. Verifica que tu dominio esté desplegado y funcionando

### El botón no funciona:
1. Verifica que estés usando `{{ .ConfirmationURL }}` (no `.Token`)
2. Revisa que las Redirect URLs estén configuradas en Supabase
3. Verifica que no haya errores en la consola del navegador

## 📚 Documentación Oficial

- [Supabase Auth Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

¿Necesitas ayuda? Revisa los logs en tu Dashboard de Supabase o contacta al soporte.

