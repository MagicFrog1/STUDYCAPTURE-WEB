## Apuntes IA

Sube imágenes de tus apuntes y obtén resúmenes estéticos y listos para estudiar.

### Desarrollo

1. Copia `.env.example` a `.env.local` y completa las variables:

```
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

2. Instala dependencias y ejecuta:

```
npm i
npm run dev
```

### Stripe

Debes crear dos precios en Stripe (mensual 7,99€ y anual 69,99€) y poner sus IDs en `STRIPE_PRICE_MONTHLY` y `STRIPE_PRICE_YEARLY`.

### Cuota gratuita

Se permiten 2 usos gratis por dispositivo/navegador mediante cookie. A partir de ahí se requiere suscripción.

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
