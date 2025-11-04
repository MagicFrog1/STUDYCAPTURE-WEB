"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/generar" || pathname === "/login") return null;
  return <Header />;
}


