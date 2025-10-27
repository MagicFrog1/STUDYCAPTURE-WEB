import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

  const bodySchema = z.object({
  options: z.object({
    size: z.enum(["mini", "media", "larga"]),
    complexity: z.enum(["baja", "media", "alta"]),
    colorStyle: z.enum(["neutro", "pastel", "vivo"]),
    creativity: z.enum(["preciso", "equilibrado", "creativo"]),
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
    const isDev = process.env.NODE_ENV !== "production";
    
     // Leer token del header Authorization
     const authHeader = req.headers.get("authorization");
     const accessToken = authHeader?.replace("Bearer ", "") ?? null;
     
     let userId = null;
     if (accessToken) {
       // Crear cliente de Supabase autenticado con el token
       const { createClient } = await import("@supabase/supabase-js");
       const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://swljiqodhagjtfgzcwyc.supabase.co";
       const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bGppcW9kaGFnanRmZ3pjd3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjU2MjAsImV4cCI6MjA3NjY0MTYyMH0.qRY7TmxISkm4n8DmP-yfXVe5DmC9lsqQevxTSBexzGI";
       
       const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
         global: {
           headers: {
             Authorization: `Bearer ${accessToken}`
           }
         }
       });
       
       const { data, error } = await authenticatedSupabase.auth.getUser();
       if (!error && data?.user) {
         userId = data.user.id;
       }
     }
     
     console.log("DEBUG USER:", userId ? "Authenticated" : "Not authenticated");
    
     // TEMPORALMENTE DESHABILITADO PARA PROBAR LA IA
     // TODO: Re-habilitar después de probar
     // Verificar que el usuario esté suscrito (premium)
     if (false && !isDev) {
       if (!userId || !accessToken) {
         return NextResponse.json({ error: "login_required" }, { status: 401 });
       }
       
       // Usar el cliente autenticado para consultar profiles
       const { createClient } = await import("@supabase/supabase-js");
       const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://swljiqodhagjtfgzcwyc.supabase.co";
       const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bGppcW9kaGFnanRmZ3pjd3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjU2MjAsImV4cCI6MjA3NjY0MTYyMH0.qRY7TmxISkm4n8DmP-yfXVe5DmC9lsqQevxTSBexzGI";
       
       const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
         global: {
           headers: {
             Authorization: `Bearer ${accessToken}`
           }
         }
       });
       
       // Verificar si tiene premium
      // Prefer subscriptions table for robust premium check
      const { data: sub } = await authenticatedSupabase
        .from('subscriptions')
        .select('id,status,current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle();
      
      console.log("DEBUG SUBSCRIPTION (subs table):", sub ? "ACTIVE" : "NONE");
      
      if (!sub) {
        return NextResponse.json({ error: "subscription_required" }, { status: 402 });
      }
     }

    const formData = await req.formData();
    const rawOptions = formData.get("options");
    const files = formData.getAll("files");
    const userContext = String(formData.get("context") ?? "").trim();
    if (!rawOptions || files.length === 0) {
      return new NextResponse("Parámetros inválidos", { status: 400 });
    }

    const options = bodySchema.shape.options.parse(JSON.parse(String(rawOptions)));
    const sizeToMaxTokens: Record<typeof options.size, number> = {
      mini: 800,
      media: 1500,
      larga: 2800,
    };

    const openaiApiKey = process.env.OPENAI_API_KEY;
    console.log("DEBUG API KEY:", openaiApiKey ? `Present (length: ${openaiApiKey.length})` : "MISSING");
    const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

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

    // Convert images to base64 (cap first 3)
    const images: { mime: string; b64: string }[] = [];
    for (const f of files.slice(0, 3)) {
      if (typeof f === "string") continue;
      const arrayBuffer = await (f as File).arrayBuffer();
      const b64 = Buffer.from(arrayBuffer).toString("base64");
      images.push({ mime: (f as File).type, b64 });
    }

    let html = "";
    if (openai) {
      // Use GPT-4o-mini for vision if available
      const content = [
        { type: "text" as const, text: prompt },
        ...images.map((img) => ({
          type: "image_url" as const,
          image_url: { url: `data:${img.mime};base64,${img.b64}` },
        })),
      ];
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.creativity === "preciso" ? 0.2 : options.creativity === "equilibrado" ? 0.6 : 0.85,
        max_tokens: sizeToMaxTokens[options.size],
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


