import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-purple-200 card-smooth">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Términos y Condiciones</h1>
        <p className="text-gray-600 mb-6">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="prose prose-sm sm:prose base text-gray-700">
          <p>
            Al crear una cuenta en <strong>StudyCaptures</strong> aceptas las presentes condiciones de uso. Estas normas
            regulan el acceso y utilización de la plataforma, sus servicios y contenidos.
          </p>
          <h2 className="font-bold text-xl mt-6">Uso del servicio</h2>
          <ul className="list-disc pl-5">
            <li>Debes proporcionar datos veraces y mantener segura tu cuenta.</li>
            <li>Está prohibido el uso para fines ilícitos o que vulneren derechos de terceros.</li>
            <li>Podemos actualizar el servicio y estas condiciones en cualquier momento.</li>
          </ul>
          <h2 className="font-bold text-xl mt-6">Pagos y suscripciones</h2>
          <p>
            Los pagos se gestionan a través de proveedores externos (por ejemplo, Stripe). Las renovaciones, cancelaciones
            y reembolsos se rigen por la información mostrada durante el checkout y por nuestra política vigente.
          </p>
          <h2 className="font-bold text-xl mt-6">Propiedad intelectual</h2>
          <p>
            Los materiales generados pueden incluir contenido transformado y organizado por IA. Te corresponde asegurarte de
            su uso conforme a las leyes y a las normas de tu institución.
          </p>
          <h2 className="font-bold text-xl mt-6">Privacidad</h2>
          <p>
            Consulta la <Link href="/privacy" className="text-purple-700 hover:underline">Política de Privacidad</Link> para saber cómo tratamos tus datos personales.
          </p>
          <h2 className="font-bold text-xl mt-6">Contacto</h2>
          <p>
            Si tienes dudas sobre estos términos, escríbenos a <a href="mailto:studycapturesai@gmail.com" className="text-purple-700 hover:underline">studycapturesai@gmail.com</a>.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/login" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-lg font-semibold hover:shadow-lg">
            Volver al acceso
          </Link>
        </div>
      </div>
    </div>
  );
}
