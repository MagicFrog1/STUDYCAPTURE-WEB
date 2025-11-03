import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderWrapper from "@/components/HeaderWrapper";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyCaptures — Genera apuntes desde imágenes",
  description:
    "Sube fotos de tus apuntes y recibe apuntes perfectos con estilo, colores y el nivel de detalle que elijas.",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "StudyCaptures — Genera apuntes desde imágenes",
    description:
      "Sube fotos de tus apuntes y recibe apuntes perfectos con estilo, colores y el nivel de detalle que elijas.",
    url: "https://studycaptureai.com",
    siteName: "StudyCaptures",
    images: [
      { url: "/logo.svg", width: 512, height: 512, alt: "StudyCaptures" },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "StudyCaptures — Genera apuntes desde imágenes",
    description:
      "Sube fotos de tus apuntes y recibe apuntes perfectos con estilo, colores y el nivel de detalle que elijas.",
    images: ["/logo.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Organization Schema for Google Logo in Search Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'StudyCaptures',
              url: 'https://studycaptureai.com',
              logo: 'https://studycaptureai.com/logo.svg',
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeaderWrapper />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
