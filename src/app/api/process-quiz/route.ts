import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import * as pdfParseModule from "pdf-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  options: z.object({
    count: z.union([z.literal(5), z.literal(10), z.literal(20)]),
    difficulty: z.enum(["baja", "media", "alta"]),
    instantCheck: z.boolean().optional().default(false),
    level: z.enum(["secundaria", "bachillerato", "universidad", "oposiciones"]),
    focus: z.enum(["definiciones", "conceptos", "aplicaciones", "problemas"]),
  })
});

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
    const userId = userData?.user?.id;
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
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }

    const form = await req.formData();
    const rawOptions = form.get("options");
    const files = form.getAll("files");
    const userContext = String(form.get("context") ?? "").trim();
    if (!rawOptions || files.length === 0) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const options = schema.shape.options.parse(JSON.parse(String(rawOptions)));

    // Convertir hasta 10 archivos (imágenes y PDFs) a base64
    const images: { mime: string; b64: string }[] = [];
    const pdfTexts: string[] = [];
    
    for (const f of files.slice(0, 10)) {
      if (typeof f === "string") continue;
      const file = f as File;
      const arrayBuffer = await file.arrayBuffer();
      
      // Check if it's a PDF
      if (file.type === "application/pdf") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfParse = (pdfParseModule as any).default || pdfParseModule;
          const pdfData = await pdfParse(Buffer.from(arrayBuffer));
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

    let questions: { id: string; question: string; options: string[]; correctIndex: number; explanations?: string[] }[] = [];

    if (openai) {
      const instruction = `Eres StudyCaptures. Crea preguntas tipo test (opción múltiple) en español a partir de imágenes de apuntes.

REQUISITOS:
- Genera EXACTAMENTE ${options.count} preguntas.
- Cada pregunta debe tener entre 4 y 5 opciones.
- Indica el índice de la opción correcta (0-based) en 'correctIndex'.
- Incluye 'explanations' (array) con explicación breve por cada opción (por qué es correcta/incorrecta) cuando sea útil.
- Nivel: ${options.level}. Dificultad: ${options.difficulty}. Ajusta complejidad del enunciado y distractores.
- Enfoque: ${options.focus}. Prioriza el tipo de contenido indicado (p. ej., definiciones, aplicaciones, problemas).
- Sin HTML ni Markdown en el JSON final.

FORMATO JSON ESTRICTO:
{
  "questions": [
    { "question": "...", "options": ["..."], "correctIndex": 0, "explanations": ["..."] }
  ]
}

Si se aporta contexto del usuario, adáptalo:
${userContext ? userContext : "(sin contexto)"}
`;

      let finalInstruction = instruction;
      
      // Add PDF texts if any
      if (pdfTexts.length > 0) {
        finalInstruction += `\n\nTEXTO EXTRAÍDO DE PDFs:\n${pdfTexts.join("\n\n---\n\n")}`;
      }
      
      const content = [
        { type: "text" as const, text: finalInstruction },
        ...images.map((img) => ({ type: "image_url" as const, image_url: { url: `data:${img.mime};base64,${img.b64}` } })),
      ];

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.difficulty === "baja" ? 0.3 : options.difficulty === "media" ? 0.5 : 0.7,
        max_tokens: 3500,
      });
      let raw = resp.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```json\n?/i, "").replace(/```$/g, "").trim();
      try {
        const parsed = JSON.parse(raw) as { questions: { question: string; options: string[]; correctIndex: number; explanations?: string[] }[] };
        const qs = (parsed.questions || []).slice(0, options.count).map((q, i) => ({
          id: `q_${i + 1}`,
          question: String(q.question || "Pregunta"),
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.slice(0, 5).map(String) : ["Opción A", "Opción B", "Opción C", "Opción D"],
          correctIndex: Number.isInteger(q.correctIndex) ? Math.max(0, Math.min((q.options?.length ?? 4) - 1, q.correctIndex)) : 0,
          explanations: Array.isArray(q.explanations) ? q.explanations.map(String) : undefined,
        }));
        // Asegurar integridad
        questions = qs.map((q) => ({
          ...q,
          correctIndex: q.correctIndex < q.options.length ? q.correctIndex : 0,
          explanations: q.explanations && q.explanations.length === q.options.length ? q.explanations : undefined,
        }));
      } catch {
        // Fallback: demo
        questions = Array.from({ length: options.count }).map((_, i) => ({
          id: `q_${i + 1}`,
          question: `Pregunta demo ${i + 1}`,
          options: ["Opción A", "Opción B", "Opción C", "Opción D"],
          correctIndex: 0,
          explanations: ["A es correcta (demo)", "B no coincide (demo)", "C no coincide (demo)", "D no coincide (demo)"]
        }));
      }
    } else {
      // Sin API key: demo
      questions = Array.from({ length: options.count }).map((_, i) => ({
        id: `q_${i + 1}`,
        question: `Pregunta demo ${i + 1}`,
        options: ["Opción A", "Opción B", "Opción C", "Opción D"],
        correctIndex: 0,
        explanations: ["A es correcta (demo)", "B incorrecta (demo)", "C incorrecta (demo)", "D incorrecta (demo)"]
      }));
    }

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return new NextResponse(message, { status: 500 });
  }
}


