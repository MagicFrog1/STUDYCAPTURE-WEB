import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
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
    count: z.union([z.literal(10), z.literal(20), z.literal(30)]),
    difficulty: z.enum(["baja", "media", "alta"]),
    level: z.enum(["secundaria", "bachillerato", "universidad", "oposiciones"]),
    focus: z.enum(["definiciones", "conceptos", "aplicaciones", "problemas"]),
  })
});

function safeText(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Requerir login + suscripción activa
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "") ?? null;
    if (!accessToken) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    const authenticatedSupabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: userData } = await authenticatedSupabase.auth.getUser();
    const authedUser = userData?.user ?? null;
    const userId = authedUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }
    
    // Verificar estado premium desde profiles (acceso SOLO para suscriptores)
    const { data: profile } = await authenticatedSupabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.is_premium) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }

    const formData = await req.formData();
    const rawOptions = formData.get("options");
    const files = formData.getAll("files");
    const userContext = String(formData.get("context") ?? "").trim();

    if (!rawOptions || files.length === 0) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: { hasOptions: !!rawOptions, filesCount: files.length } },
        { status: 400 }
      );
    }

    const options = bodySchema.shape.options.parse(JSON.parse(String(rawOptions)));

    // Convertir hasta 10 archivos (imágenes y PDFs) a base64
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

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
    const isDev = process.env.NODE_ENV !== "production";
    if (!openai && !isDev) {
      return NextResponse.json({ error: "openai_key_missing" }, { status: 500 });
    }

    let flashcards: { id: string; question: string; answer: string }[] = [];

    if (openai) {
      const instruction = `Eres StudyCaptures, experto en crear flashcards educativas (pregunta/respuesta) de alta calidad a partir de imágenes de apuntes.

OBJETIVO: Generar exactamente ${options.count} tarjetas en español, con preguntas claras y respuestas concisas y correctas.

NIVEL (${options.level}) y DIFICULTAD (${options.difficulty}):
- baja: definiciones básicas y conceptos esenciales.
- media: conceptos con aplicaciones y ejemplos típicos.
- alta: profundidad técnica, matices, demostraciones breves o casos avanzados.

ENFOQUE: ${options.focus} (prioriza el tipo de contenido indicado en las preguntas y respuestas).

CONSEJOS DE CALIDAD:
- Variar tipos de pregunta: definición, verdadero/falso (formuladas como pregunta), completar, aplicación, por qué/para qué.
- Usar lenguaje preciso pero claro; evitar ambigüedades.
- No incluir formato HTML ni Markdown en las respuestas finales, solo texto.
- Si hay fórmulas, escribirlas en texto plano legible (por ejemplo: f'(x) = 2x).

FORMATO DE SALIDA ESTRICTO (JSON):
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}

Si el contexto del usuario se incluye, adáptate a él.
`;

      let finalInstruction = instruction + (userContext ? `\n\nCONTEXTO DEL USUARIO:\n${userContext}\n` : "");
      
      // Add PDF texts if any
      if (pdfTexts.length > 0) {
        const joined = pdfTexts.join("\n\n---\n\n");
        const truncated = joined.slice(0, 12000);
        finalInstruction += `\n\nTEXTO EXTRAÍDO DE PDFs (usa estrictamente este contenido como base de las tarjetas):\n${truncated}`;
      }
      
      const content = [
        { type: "text" as const, text: finalInstruction },
        ...images.map((img) => ({
          type: "image_url" as const,
          image_url: { url: `data:${img.mime};base64,${img.b64}` },
        })),
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.difficulty === "baja" ? 0.3 : options.difficulty === "media" ? 0.5 : 0.7,
        max_tokens: 2500,
      });
      let raw = response.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```json\n?/i, "").replace(/```$/g, "").trim();

      try {
        const parsed = JSON.parse(raw) as { flashcards: { question: string; answer: string }[] };
        flashcards = (parsed.flashcards || []).slice(0, options.count).map((c, i) => ({
          id: `fc_${i + 1}`,
          question: safeText(c.question || ""),
          answer: safeText(c.answer || ""),
        }));
      } catch {
        // Fallback: generar estructura mínima si el JSON no parsea
        flashcards = Array.from({ length: options.count }).map((_, i) => ({
          id: `fc_${i + 1}`,
          question: `Pregunta ${i + 1}: concepto clave del tema`,
          answer: `Respuesta ${i + 1}: explicación breve y correcta del concepto`,
        }));
      }
    } else {
      // Sin clave de OpenAI: demo
      flashcards = Array.from({ length: options.count }).map((_, i) => ({
        id: `fc_${i + 1}`,
        question: `Pregunta demo ${i + 1}`,
        answer: `Respuesta demo ${i + 1}`,
      }));
    }

    return NextResponse.json({ flashcards });
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


