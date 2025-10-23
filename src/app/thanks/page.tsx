import Link from "next/link";

export default function Thanks() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">¡Gracias por suscribirte!</h1>
        <p className="mt-3 opacity-80">Tu suscripción se ha activado. Ya puedes generar resúmenes ilimitados.</p>
        <Link href="/" className="mt-6 inline-block rounded-md bg-black text-white px-4 py-2">Volver al inicio</Link>
      </div>
    </main>
  );
}


