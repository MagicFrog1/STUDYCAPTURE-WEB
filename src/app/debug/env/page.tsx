export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span className="text-gray-600 font-medium">{label}</span>
      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">{String(value ?? "<null>")}</code>
    </div>
  );
}

function ClientEnv() {
  "use client";
  const clientSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clientBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Cliente (valor incrustado en build)</h3>
      <Row label="NEXT_PUBLIC_SUPABASE_URL" value={clientSupabaseUrl} />
      <Row label="NEXT_PUBLIC_BASE_URL" value={clientBaseUrl} />
    </div>
  );
}

export default function DebugEnvPage() {
  const serverSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug de variables públicas</h1>
      <p className="text-gray-600">Compara los valores del servidor (runtime) vs cliente (incrustado al compilar). No se muestra ninguna clave.</p>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Servidor (runtime actual)</h3>
        <Row label="NEXT_PUBLIC_SUPABASE_URL" value={serverSupabaseUrl} />
        <Row label="NEXT_PUBLIC_BASE_URL" value={serverBaseUrl} />
      </div>

      <ClientEnv />
    </div>
  );
}


