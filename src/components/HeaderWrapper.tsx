"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname === "/generar" ||
    pathname === "/login" ||
    pathname?.startsWith("/generar/flashcards") ||
    pathname?.startsWith("/generar/test") ||
    pathname?.startsWith("/generar/mapas") ||
    pathname?.startsWith("/generar/panel")
  ) return null;
  return <Header />;
}


