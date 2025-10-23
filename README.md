## StudyCaptures

Sube imágenes de tus apuntes y obtén resúmenes estéticos y listos para estudiar.

### Variables de Entorno Requeridas

#### Para Desarrollo Local
Crea un archivo `.env.local` con las siguientes variables:

```env
# OpenAI API
OPENAI_API_KEY=tu_clave_openai

# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_MONTHLY=prod_TI4RSiWSI0DT4R
STRIPE_PRODUCT_YEARLY=prod_TI4RRTZhyhpklk
STRIPE_MONTHLY_UNIT_AMOUNT_CENTS=499
STRIPE_YEARLY_UNIT_AMOUNT_CENTS=3999
STRIPE_CURRENCY=eur

# Supabase (Base de datos)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role

# URL Base
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Para Vercel (Producción)
Configura estas variables en el dashboard de Vercel:

1. **OPENAI_API_KEY**: Tu clave de API de OpenAI
2. **STRIPE_SECRET_KEY**: Clave secreta de Stripe (sk_live_...)
3. **STRIPE_WEBHOOK_SECRET**: Secreto del webhook de Stripe
4. **STRIPE_PRODUCT_MONTHLY**: prod_TI4RSiWSI0DT4R
5. **STRIPE_PRODUCT_YEARLY**: prod_TI4RRTZhyhpklk
6. **STRIPE_MONTHLY_UNIT_AMOUNT_CENTS**: 499
7. **STRIPE_YEARLY_UNIT_AMOUNT_CENTS**: 3999
8. **STRIPE_CURRENCY**: eur
9. **NEXT_PUBLIC_SUPABASE_URL**: URL de tu proyecto Supabase
10. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Clave anónima de Supabase
11. **SUPABASE_SERVICE_ROLE_KEY**: Clave de servicio de Supabase
12. **NEXT_PUBLIC_BASE_URL**: https://tu-dominio.vercel.app

### Instalación y Desarrollo

```bash
npm install
npm run dev
```

### Configuración de Stripe

1. Crea productos en Stripe Dashboard:
   - Producto Mensual: 4,99€/mes
   - Producto Anual: 39,99€/año

2. Configura el webhook en Stripe:
   - URL: `https://tu-dominio.vercel.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

### Funcionalidades

- **Perfil de Usuario**: Gestión de sesión y suscripción
- **Gestión de Suscripciones**: Cambiar o cancelar planes
- **Política de Privacidad**: Información completa sobre el manejo de datos
- **Cuota Gratuita**: 2 usos gratis por dispositivo
- **Pagos Seguros**: Integración completa con Stripe

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
