import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
// Cargar pdf-parse dinámicamente para evitar problemas ESM/CJS en build de Vercel
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPdfParse(): Promise<any> {
  const mod: any = await import("pdf-parse");
  return mod.default || mod;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

  const bodySchema = z.object({
  options: z.object({
    size: z.enum(["mini", "media", "larga"]),
    complexity: z.enum(["baja", "media", "alta"]),
    colorStyle: z.enum(["neutro", "pastel", "vivo"]),
    creativity: z.enum(["preciso", "equilibrado", "creativo"]),
    fullTopic: z.boolean().optional().default(false),
  }),
});

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMathInCode(html: string): string {
  // Transform common LaTeX-like patterns inside <code>...</code> into readable inline math
  return html.replace(/<code>([\s\S]*?)<\/code>/g, (_m, inner) => {
    let t = inner;
    // \frac{a}{b} -> (a) / (b)
    t = t.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1) / ($2)");
    // \sqrt{n} -> √n
    t = t.replace(/\\sqrt\{([^{}]+)\}/g, "√$1");
    // _{k} or _k -> (k)
    t = t.replace(/_\{([^{}]+)\}/g, "($1)");
    t = t.replace(/_([a-zA-Z0-9]+)/g, "($1)");
    // \bar{X} -> X̄ (combining macron)
    t = t.replace(/\\bar\{([A-Za-z])\}/g, "$1\u0304");
    // Greek letters
    const greek: Record<string, string> = {
      "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε",
      "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\iota": "ι", "\\kappa": "κ",
      "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\xi": "ξ", "\\pi": "π",
      "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\upsilon": "υ", "\\phi": "φ",
      "\\chi": "χ", "\\psi": "ψ", "\\omega": "ω",
      "\\Gamma": "Γ", "\\Delta": "Δ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Xi": "Ξ",
      "\\Pi": "Π", "\\Sigma": "Σ", "\\Upsilon": "Υ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω"
    };
    for (const k in greek) {
      t = t.replace(new RegExp(k, "g"), greek[k]);
    }
    // Remove unnecessary braces around single tokens: {X} -> X
    t = t.replace(/\{\s*([A-Za-z0-9]+)\s*\}/g, "$1");
    return `<code>${t}</code>`;
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Requerir login + suscripción activa
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "") ?? null;
    if (!accessToken) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }
    let userId: string | null = null;
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    const authenticatedSupabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });
    const { data, error } = await authenticatedSupabase.auth.getUser();
    const authedUser = !error ? data?.user : null;
    if (authedUser) userId = authedUser.id;
    if (!userId) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }
    
    // Verificar estado premium desde profiles
    const { data: profile } = await authenticatedSupabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!profile?.is_premium) {
      const confirmedAt =
        // @ts-ignore - coalesce possible fields from Supabase user
        (authedUser?.email_confirmed_at as string | null) ??
        // @ts-ignore
        (authedUser?.confirmed_at as string | null) ??
        (authedUser?.created_at as string | null) ??
        null;
      const trialUntil =
        confirmedAt ? new Date(confirmedAt).getTime() + 7 * 24 * 60 * 60 * 1000 : null;
      const now = Date.now();
      const inTrial = trialUntil !== null && now < trialUntil;
      if (!inTrial) {
        return NextResponse.json({ error: "subscription_required" }, { status: 402 });
      }
    }

    const formData = await req.formData();
    const rawOptions = formData.get("options");
    const files = formData.getAll("files");
    const userContext = String(formData.get("context") ?? "").trim();
    
    // Debug logging
    console.log("=== PROCESS API DEBUG ===");
    console.log("Files count:", files.length);
    console.log("Has options:", !!rawOptions);
    console.log("Options value:", rawOptions ? String(rawOptions).substring(0, 100) : "null");
    console.log("User context length:", userContext.length);
    console.log("========================");
    
    if (!rawOptions || files.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: { hasOptions: !!rawOptions, filesCount: files.length } },
        { status: 400 }
      );
    }

    const options = bodySchema.shape.options.parse(JSON.parse(String(rawOptions)));
    const sizeToMaxTokens: Record<typeof options.size, number> = {
      mini: 800,
      media: 1500,
      larga: 2800,
    };
    let maxTokens = sizeToMaxTokens[options.size];
    if (options.fullTopic) {
      // Modo "apuntes completos": sube sustancialmente el presupuesto de tokens
      if (options.size === "mini") {
        maxTokens = 5000;
      } else if (options.size === "media") {
        maxTokens = 9000;
      } else {
        maxTokens = 12000;
      }
      // Seguridad: no exceder un límite razonable
      maxTokens = Math.min(maxTokens, 12000);
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log("DEBUG API KEY:", openaiApiKey ? `Present (length: ${openaiApiKey.length})` : "MISSING");
    const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
    const isDev = process.env.NODE_ENV !== "production";
    if (!openai && !isDev) {
      return NextResponse.json({ error: "openai_key_missing" }, { status: 500 });
    }

    // Build prompt (enhanced with AI knowledge integration)
    let prompt = `Eres StudyCaptures, un asistente educativo avanzado que transforma fotos de apuntes en apuntes completos y pedagógicos usando tu conocimiento académico.

METODOLOGÍA DE ANÁLISIS Y ENRIQUECIMIENTO:
1. ANALIZA el contenido visual de las imágenes (texto, fórmulas, diagramas, esquemas)
2. IDENTIFICA el tema/disciplina académica específica
3. USA tu conocimiento interno para:
   - Completar definiciones incompletas o ambiguas
   - Añadir ejemplos ilustrativos relevantes 
   - Explicar conexiones entre conceptos
   - Proporcionar contexto histórico o teórico cuando sea educativo
   - Sugerir aplicaciones prácticas del conocimiento
4. ESTRUCTURA el contenido de forma pedagógica y progresiva 

PRINCIPIOS EDUCATIVOS:
- Prioriza la comprensión sobre la memorización
- Explica el "por qué" detrás de cada concepto
- Conecta ideas nuevas con conocimientos previos
- Usa analogías y ejemplos del mundo real cuando sea apropiado
- Mantén un equilibrio entre rigor académico y claridad

FORMATO DE SALIDA (HTML estructurado):
- Usa únicamente: <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <blockquote>
- No uses estilos en línea, tablas ni imágenes
- Máximo 2 niveles de listas anidadas
- Estructura recomendada por tema:
  <h3>Tema Principal</h3>
  <p><strong>Concepto clave:</strong> definición clara y completa</p>
  <p><strong>Importancia:</strong> por qué es relevante</p>
  <ol><li>Paso/principio 1</li><li>Paso/principio 2</li></ol>
  <p><strong>Ejemplo práctico:</strong> aplicación concreta</p>
  <p><strong>Conexiones:</strong> relación con otros conceptos</p>

CONFIGURACIÓN POR PARÁMETROS:
- Tamaño (${options.size}):
  • mini: Conceptos esenciales + definiciones clave + 1-2 ejemplos
  • media: Desarrollo completo + múltiples ejemplos + conexiones
  • larga: Análisis profundo + contexto histórico + aplicaciones + ejercicios sugeridos

- Complejidad (${options.complexity}):
  • baja: Lenguaje accesible, analogías simples, evita jerga técnica
  • media: Terminología apropiada, explicaciones detalladas, ejemplos variados
  • alta: Análisis técnico profundo, demostraciones, casos avanzados

- Estilo (${options.colorStyle}):
  • neutro: Presentación académica formal
  • pastel: Enfoque amigable y motivador
  • vivo: Presentación dinámica y estimulante

ESPECIALIZACIÓN POR DISCIPLINAS:
- Matemáticas/Física: 
  • Explica el razonamiento detrás de cada fórmula
  • Proporciona derivaciones paso a paso cuando sea educativo
  • Incluye aplicaciones prácticas y ejemplos del mundo real
  • Menciona errores comunes y cómo evitarlos

- Química/Biología:
  • Explica mecanismos y procesos paso a paso
  • Conecta conceptos con fenómenos observables
  • Incluye aplicaciones industriales o médicas relevantes
  • Explica la importancia biológica o química de cada proceso

- Historia/Ciencias Sociales:
  • Proporciona contexto histórico completo
  • Explica causas y consecuencias de eventos
  • Conecta eventos con patrones históricos más amplios
  • Incluye perspectivas múltiples cuando sea relevante

- Literatura/Artes:
  • Analiza elementos estilísticos y temáticos
  • Conecta obras con movimientos artísticos
  • Explica técnicas y recursos utilizados
  • Proporciona interpretaciones críticas fundamentadas

FORMATO MATEMÁTICO MEJORADO:
- Convierte LaTeX a texto legible: \\frac{a}{b} → (a)/(b), \\sqrt{n} → √n
- Explica el significado de cada símbolo y variable
- Proporciona interpretación geométrica o física cuando aplique
- Incluye casos especiales y límites importantes

ENRIQUECIMIENTO INTELIGENTE:
- Si detectas conceptos incompletos, completa la información usando tu conocimiento
- Añade ejemplos adicionales que ilustren mejor el concepto
- Explica conexiones con otros temas de la misma disciplina
- Proporciona contexto histórico o teórico relevante
- Sugiere aplicaciones prácticas o ejercicios de práctica

ESTRUCTURA PEDAGÓGICA AVANZADA:
Para cada concepto principal, incluye:
1. <p><strong>Definición:</strong> explicación clara y precisa</p>
2. <p><strong>Contexto:</strong> dónde y por qué surge este concepto</p>
3. <p><strong>Desarrollo:</strong> pasos, propiedades o características</p>
4. <p><strong>Ejemplos:</strong> casos concretos y aplicaciones</p>
5. <p><strong>Importancia:</strong> relevancia académica y práctica</p>
6. <p><strong>Conexiones:</strong> relación con otros conceptos</p>

OBJETIVO FINAL:
Crear apuntes educativos que no solo reproduzcan el contenido visual, sino que lo enriquezcan con conocimiento académico adicional, explicaciones claras y conexiones que faciliten el aprendizaje profundo y la comprensión integral del tema.
`;

    if (userContext) {
      // Integra el contexto del usuario como guía educativa completa
      prompt += `

CONTEXTO EDUCATIVO DEL USUARIO:
${userContext}

INSTRUCCIONES PARA USAR EL CONTEXTO:
- Utiliza esta información para personalizar el nivel educativo y enfoque
- Adapta el lenguaje y ejemplos al nivel académico especificado
- Incorpora la terminología y notación preferida mencionada
- Enfoca el contenido hacia los objetivos de aprendizaje indicados
- Si se menciona un examen específico, incluye tipos de preguntas típicas
- Respeta el enfoque pedagógico del profesor cuando se especifique
- Usa este contexto para enriquecer las explicaciones con información relevante
- Conecta los conceptos de las imágenes con el marco académico proporcionado
`;
    }

    if (options.fullTopic) {
      // Modo "apuntes completos del tema": fuerza un desarrollo exhaustivo
      prompt += `

MODO APUNTES COMPLETOS DEL TEMA:
- Detecta el TEMA global de las imágenes y desarróllalo de forma EXHAUSTIVA.
- Identifica el TIPO DE CONTENIDO predominante:
  • Ejercicio/Problema: infiere enunciado y objetivo, datos dados, estrategia, resolución paso a paso con justificación, comprobación del resultado y variantes similares.
  • Clasificación/Esquema: define criterio de clasificación, lista subtipos, diferencias clave entre subtipos, ejemplos de cada uno y cuándo usar cada categoría.
  • Resumen teórico/mapa conceptual: define conceptos, propiedades/leyes/teoremas, relaciones entre conceptos, ejemplos canónicos y aplicaciones prácticas.
- Referénciate explícitamente a elementos visibles (símbolos, unidades, diagramas, tablas, títulos parciales) para anclar el contenido a la imagen.
- Estructura recomendada (ajústala si el tipo lo requiere):
  1) <h3>Resumen del tema</h3>
  2) <p><strong>Puntos clave:</strong> lista breve de ideas principales</p>
  3) <h3>Definiciones y conceptos fundamentales</h3>
  4) <h3>Propiedades, teoremas o leyes</h3>
  5) <h3>Procedimientos o métodos</h3>
     <ol>
       <li>Pasos numerados con <strong>justificación</strong> de cada paso</li>
       <li>Condiciones previas y <strong>supuestos</strong> de aplicación</li>
       <li><strong>Variantes</strong> del método según casos y cómo elegir</li>
       <li><strong>Validaciones</strong> y comprobaciones del resultado</li>
     </ol>
  6) <h3>Ejemplos resueltos</h3>
     <ul>
       <li>Mínimo 3: <em>básico</em>, <em>intermedio</em>, <em>avanzado</em></li>
       <li>Mostrar datos, desarrollo paso a paso, resultado y <strong>por qué</strong> funciona</li>
       <li>Incluir <strong>variación</strong> o alternativa y su efecto</li>
       <li>Referenciar elementos visibles de la imagen si aplica</li>
     </ul>
  7) <h3>Aplicaciones prácticas</h3>
  8) <h3>Errores comunes y cómo evitarlos</h3>
     <ul>
       <li>Al menos 6 errores típicos con causa y prevención</li>
       <li>Ejemplo de <code>mal</code> vs <code>correcto</code> cuando sea útil</li>
     </ul>
  9) <h3>Ejercicios sugeridos</h3>
     <ul>
       <li>Al menos 8 enunciados variados por nivel y tipo</li>
       <li>Incluir <strong>pista</strong> o resultado esperado de forma breve</li>
       <li>Indicar criterio de corrección o rúbrica cuando aplique</li>
     </ul>
  10) <h3>Resumen final</h3> con ideas para repasar rápido
- Adaptación por ASIGNATURA (si se detecta):
  • Matemáticas: tipo de objeto (funciones, límites, derivadas, integrales, álgebra lineal, probabilidad), notación coherente, demostraciones abreviadas cuando aporte valor, interpretación geométrica.
  • Física: magnitudes, unidades SI, leyes relevantes, modelado, aproximaciones, análisis dimensional y orden de magnitud.
  • Química: reacciones, estequiometría, estados, mecanismos, condiciones, seguridad y aplicaciones.
  • Biología: niveles (celular, tisular, sistémico), procesos/mecanismos y relaciones estructura-función.
  • Informática: definiciones formales, pseudocódigo/algoritmos, complejidad, estructuras de datos, casos borde.
  • Economía/Derecho/Sociales: definiciones operativas, marcos teóricos, supuestos, casos y contraejemplos.
  • Lenguas/Literatura: recursos, figuras, géneros, análisis textual, ejemplos comentados.
- Mantén únicamente las etiquetas HTML permitidas y segmenta con títulos/listas para máxima claridad.
`;
    }

    // Convert images and PDFs to base64 (up to 10 files)
    const images: { mime: string; b64: string }[] = [];
    const pdfTexts: string[] = [];
    
    // Cargar pdf-parse on-demand
    let pdfParseFn: ((data: Buffer) => Promise<{ text: string }>) | null = null;
    for (const f of files) {
      if (typeof f === "string") continue;
      const file = f as File;
      const arrayBuffer = await file.arrayBuffer();
      
      // Check if it's a PDF
      if (file.type === "application/pdf") {
        try {
          if (!pdfParseFn) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pdfParseFn = await getPdfParse();
          }
          const pdfData = await pdfParseFn!(Buffer.from(arrayBuffer));
          pdfTexts.push(pdfData.text);
        } catch (pdfError) {
          console.error("Error parsing PDF:", pdfError);
          pdfTexts.push("[Error al procesar PDF]");
        }
      } else if (file.type.startsWith("image/")) {
        const b64 = Buffer.from(arrayBuffer).toString("base64");
        images.push({ mime: file.type, b64 });
      }
    }

    let html = "";
    if (openai) {
      // Add PDF texts to the prompt if any
      let finalPrompt = prompt;
      if (pdfTexts.length > 0) {
        const joined = pdfTexts.join("\n\n---\n\n");
        const truncated = joined.slice(0, 12000);
        finalPrompt += `\n\nTEXTO EXTRAÍDO DE PDFs (usa estrictamente este contenido como base del desarrollo):\n${truncated}`;
      }
      
      // Use GPT-4o-mini for vision if available
      const content = [
        { type: "text" as const, text: finalPrompt },
        ...images.map((img) => ({
          type: "image_url" as const,
          image_url: { url: `data:${img.mime};base64,${img.b64}` },
        })),
      ];
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.creativity === "preciso" ? 0.2 : options.creativity === "equilibrado" ? 0.6 : 0.85,
        max_tokens: maxTokens,
      });
      html = response.choices[0]?.message?.content ?? "";
      // Clean model output: strip code fences and any html/body wrappers
      html = html
        .replace(/^```[a-zA-Z]*\n?/g, "")
        .replace(/```$/g, "")
        .replace(/```/g, "")
        .replace(/<\/?(html|head|body)[^>]*>/gi, "")
        .trim();
    } else {
      // Fallback demo when no API key
      const list = images.map((_, i) => `<li>Concepto clave ${i + 1} con explicación breve.</li>`).join("");
      html = `<h3>Apuntes demo</h3><ul>${list}</ul>` +
        (userContext ? `<p><em>Contexto:</em> ${htmlEscape(userContext)}</p>` : "") +
        `<p><em>Config:</em> ${htmlEscape(JSON.stringify(options))}</p>`;
    }

    // Normalize math expressions inside <code> blocks (convert LaTeX-like to readable text)
    html = normalizeMathInCode(html);

    const chunks = [
      { id: "c1", title: "Apuntes", content: html },
    ];

    return NextResponse.json({ chunks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return new NextResponse(message, { status: 500 });
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    },
  });
}


