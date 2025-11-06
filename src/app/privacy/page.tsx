export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden card-smooth">
          <div className="relative px-6 py-8 text-white bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <img src="/logo.svg" alt="StudyCaptures" className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
            </div>
            <p className="text-white/80">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </div>

          <div className="p-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Recopilamos información que nos proporcionas directamente cuando utilizas nuestros servicios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Información de cuenta:</strong> Dirección de correo electrónico cuando te registras</li>
                  <li><strong>Imágenes de apuntes:</strong> Las fotos que subes para procesar con IA</li>
                  <li><strong>Información de pago:</strong> Datos necesarios para procesar suscripciones (manejados por Stripe)</li>
                  <li><strong>Uso de la aplicación:</strong> Información sobre cómo utilizas nuestros servicios</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo Utilizamos tu Información</h2>
              <div className="space-y-4 text-gray-700">
                <p>Utilizamos la información recopilada para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Procesar tus imágenes de apuntes y generar resúmenes</li>
                  <li>Proporcionar y mantener nuestros servicios</li>
                  <li>Procesar pagos y gestionar suscripciones</li>
                  <li>Comunicarnos contigo sobre actualizaciones del servicio</li>
                  <li>Mejorar nuestros algoritmos de IA</li>
                  <li>Cumplir con obligaciones legales</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Compartir Información</h2>
              <div className="space-y-4 text-gray-700">
                <p>No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Proveedores de servicios:</strong> Stripe (pagos), OpenAI (procesamiento de IA), Supabase (base de datos)</li>
                  <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley</li>
                  <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos o los de nuestros usuarios</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Seguridad de los Datos</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cifrado de datos en tránsito y en reposo</li>
                  <li>Acceso restringido a la información personal</li>
                  <li>Monitoreo regular de seguridad</li>
                  <li>Cumplimiento con estándares de la industria</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Tus Derechos</h2>
              <div className="space-y-4 text-gray-700">
                <p>Tienes derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acceder a tu información personal</li>
                  <li>Rectificar información incorrecta</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Limitar el procesamiento de tu información</li>
                  <li>Portabilidad de datos</li>
                  <li>Oponerte al procesamiento</li>
                </ul>
                <p>
                  Para ejercer estos derechos, contacta con nosotros en:{" "}
                  <a href="mailto:studycapturesai@gmail.com" className="text-blue-600 hover:underline">
                    studycapturesai@gmail.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Retención de Datos</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Conservamos tu información personal durante el tiempo necesario para cumplir con los propósitos 
                  descritos en esta política, a menos que la ley requiera un período de retención más largo.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Datos de cuenta:</strong> Mientras tu cuenta esté activa</li>
                  <li><strong>Imágenes procesadas:</strong> Se eliminan automáticamente después de 30 días</li>
                  <li><strong>Datos de pago:</strong> Según los requisitos legales y de Stripe</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Utilizamos cookies y tecnologías similares para mejorar tu experiencia:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cookies esenciales:</strong> Para el funcionamiento básico del sitio</li>
                  <li><strong>Cookies de autenticación:</strong> Para mantener tu sesión</li>
                  <li><strong>Cookies de uso:</strong> Para contar usos gratuitos</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Transferencias Internacionales</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de tu país. 
                  Nos aseguramos de que estas transferencias cumplan con las leyes aplicables de protección de datos.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos conscientemente 
                  información personal de menores de 16 años.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cambios a esta Política</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre 
                  cambios significativos por correo electrónico o mediante un aviso en nuestro sitio web.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Si tienes preguntas sobre esta política de privacidad, puedes contactarnos:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> studycapturesai@gmail.com</p>
                  <p><strong>Asunto:</strong> Consulta sobre Política de Privacidad</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
