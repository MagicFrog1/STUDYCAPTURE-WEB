import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-[0_24px_60px_rgba(15,23,42,0.9)] border border-slate-700/80 card-smooth">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 mb-3">Términos y Condiciones</h1>
        <p className="text-slate-400 mb-6">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="prose prose-sm sm:prose base text-slate-300 prose-headings:text-slate-100 prose-strong:text-slate-100 prose-a:text-sky-400">
          <p>
            Al crear una cuenta en <strong>StudyCaptures</strong> aceptas las presentes condiciones de uso. Estas normas
            regulan el acceso y utilización de la plataforma, sus servicios y contenidos.
          </p>
          <h2 className="font-bold text-xl mt-6 text-slate-100">Uso del servicio</h2>
          <ul className="list-disc pl-5 text-slate-300 space-y-2">
            <li>Debes proporcionar datos veraces y mantener segura tu cuenta.</li>
            <li>Está prohibido el uso para fines ilícitos o que vulneren derechos de terceros.</li>
            <li>Podemos actualizar el servicio y estas condiciones en cualquier momento.</li>
          </ul>
          <h2 className="font-bold text-xl mt-6 text-slate-100">Pagos y suscripciones</h2>
          <p className="text-slate-300">
            Los pagos se gestionan a través de proveedores externos (por ejemplo, Stripe). Las renovaciones, cancelaciones
            y reembolsos se rigen por la información mostrada durante el checkout y por nuestra política vigente.
          </p>
          <h2 className="font-bold text-xl mt-6 text-slate-100">Propiedad intelectual</h2>
          <p className="text-slate-300">
            Los materiales generados pueden incluir contenido transformado y organizado por IA. Te corresponde asegurarte de
            su uso conforme a las leyes y a las normas de tu institución.
          </p>
          <h2 className="font-bold text-xl mt-6 text-slate-100">Privacidad</h2>
          <p className="text-slate-300">
            Consulta la <Link href="/privacy" className="text-sky-400 hover:text-sky-300 hover:underline">Política de Privacidad</Link> para saber cómo tratamos tus datos personales.
          </p>
          <h2 className="font-bold text-xl mt-6 text-slate-100">Contacto</h2>
          <p className="text-slate-300">
            Si tienes dudas sobre estos términos, escríbenos a <a href="mailto:studycapturesai@gmail.com" className="text-sky-400 hover:text-sky-300 hover:underline">studycapturesai@gmail.com</a>.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/login" className="inline-block bg-[radial-gradient(circle_at_0_0,#22d3ee,transparent_55%),radial-gradient(circle_at_100%_0,#a855f7,transparent_55%),linear-gradient(90deg,#1d4ed8,#4f46e5,#a855f7)] text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
            Volver al acceso
          </Link>
        </div>
      </div>
    </div>
  );
}
