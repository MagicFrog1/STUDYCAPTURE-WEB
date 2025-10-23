"use client";

import Link from "next/link";
import UserProfile from "@/components/UserProfile";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">StudyCaptures</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Inicio
            </Link>
            <Link 
              href="/generar" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Generar Apuntes
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacidad
            </Link>
          </nav>

          {/* User Profile */}
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
