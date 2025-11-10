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

const schema = z.object({
  options: z.object({
    mode: z.enum(["generate", "evaluate"]).default("generate"),
    count: z.number().min(1).max(20).default(5),
    difficulty: z.enum(["baja", "media", "alta"]).default("media"),
    level: z.enum(["secundaria", "bachillerato", "universidad", "oposiciones"]).default("universidad"),
    questionType: z.enum(["definiciones", "normales", "mixto"]).default("normales"),
  }).passthrough()
});

type QAQuestion = { id: string; question: string; referenceAnswer: string };

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
    
    // Verificar estado premium desde profiles
    const { data: profile } = await authenticatedSupabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!profile?.is_premium) {
      const confirmedAt =
        // @ts-ignore
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

    const joinedPdfText = pdfTexts.join("\n\n---\n\n").slice(0, 16000);

    if (options.mode === "generate") {
      if (!openai) {
        const demo: QAQuestion[] = Array.from({ length: Math.min(3, options.count) }).map((_, i) => ({
          id: `q${i + 1}`,
          question: `Pregunta de desarrollo #${i + 1}: Explica el concepto principal visto en la imagen.`,
          referenceAnswer: "Respuesta modelo: definición clara, propiedades clave y ejemplo breve."
        }));
        return NextResponse.json({ questions: demo });
      }

      let instruction = `Eres StudyCaptures. A partir de las IMÁGENES adjuntas (y el TEXTO de PDFs si existe), genera preguntas LARGAS de desarrollo en español.

REQUISITOS:
- Devuelve SOLO JSON válido sin markdown.
- Estructura:
{ "questions": [ { "id": "q1", "question": "...", "referenceAnswer": "..." } ] }
- Genera ${options.count} preguntas largas, nivel ${options.level}, dificultad ${options.difficulty}.
- Tipo de preguntas: ${options.questionType}. Si es "definiciones", pide definiciones precisas con matices y ejemplos breves; si es "normales", preguntas de desarrollo; si es "mixto", combina ambos estilos.
- Cada "question" debe invitar a desarrollar: definición, ideas clave, relaciones, aplicaciones, errores comunes o ejemplos.
- En "referenceAnswer" escribe una respuesta modelo sólida, concisa (6-12 frases) y basada ESTRICTAMENTE en el contenido proporcionado (imágenes/PDFs).
- Si la evidencia es escasa, formula preguntas más generales pero siempre ancladas al material.
${userContext ? `\nCONTEXTO USUARIO:\n${userContext}\n` : ""}`;

      if (joinedPdfText) {
        instruction += `\n\nTEXTO EXTRAÍDO DE PDFs (prioritario como fuente):\n${joinedPdfText}`;
      }

      const content = [
        { type: "text" as const, text: instruction },
        ...images.map((img) => ({ type: "image_url" as const, image_url: { url: `data:${img.mime};base64,${img.b64}` } })),
      ];

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.difficulty === "baja" ? 0.3 : options.difficulty === "media" ? 0.5 : 0.7,
        max_tokens: 4500,
      });
      let raw = resp.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```json\n?/i, "").replace(/```$/g, "").trim();
      try {
        const parsed = JSON.parse(raw) as { questions?: QAQuestion[] };
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        return NextResponse.json({ questions });
      } catch {
        const demo: QAQuestion[] = Array.from({ length: Math.min(3, options.count) }).map((_, i) => ({
          id: `q${i + 1}`,
          question: `Pregunta de desarrollo #${i + 1}: Explica el concepto principal visto en la imagen.`,
          referenceAnswer: "Respuesta modelo: definición clara, propiedades clave y ejemplo breve."
        }));
        return NextResponse.json({ questions: demo });
      }
    }

    if (options.mode === "evaluate") {
      const rawAnswers = form.get("answers");
      const rawQuestions = form.get("questions");
      const answers = rawAnswers ? (JSON.parse(String(rawAnswers)) as Record<string, string>) : {};
      const questions = rawQuestions ? (JSON.parse(String(rawQuestions)) as QAQuestion[]) : [];
      if (!questions || Object.keys(answers).length === 0) {
        return NextResponse.json({ error: "answers_or_questions_missing" }, { status: 400 });
      }

      if (!openai) {
        const results = questions.map((q) => ({
          id: q.id,
          score: 60,
          feedback: "Respuesta razonable. Podrías añadir ejemplos y matizar definiciones.",
          referenceAnswer: q.referenceAnswer,
          userAnswer: answers[q.id] ?? ""
        }));
        const overall = results.reduce((a, r) => a + r.score, 0) / results.length;
        return NextResponse.json({ results, overall });
      }

      let evalInstruction = `Eres StudyCaptures. Evalúa respuestas LARGAS de estudiante comparándolas con RESPUESTAS MODELO y el contenido de IMÁGENES/PDF (si existe).

DEVUELVE SOLO JSON:
{
  "results": [
    { "id": "q1", "score": 0-100, "feedback": "texto breve de mejora" }
  ],
  "overall": 0-100
}

CRITERIOS:
- Valora precisión conceptual, cobertura de ideas clave, claridad, ejemplos y ausencia de errores.
- Basa la corrección en el material aportado; evita inventar.
- "score" es porcentaje 0-100.
${userContext ? `\nCONTEXTO USUARIO:\n${userContext}\n` : ""}`;

      if (joinedPdfText) {
        evalInstruction += `\n\nTEXTO EXTRAÍDO DE PDFs (prioritario como evidencia):\n${joinedPdfText}`;
      }

      const payload = {
        questions,
        answers
      };

      const content = [
        { type: "text" as const, text: evalInstruction },
        { type: "text" as const, text: JSON.stringify(payload).slice(0, 14000) },
        ...images.map((img) => ({ type: "image_url" as const, image_url: { url: `data:${img.mime};base64,${img.b64}` } })),
      ];

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: 0.2,
        max_tokens: 4000,
      });
      let raw = resp.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```json\n?/i, "").replace(/```$/g, "").trim();
      try {
        const parsed = JSON.parse(raw) as { results?: Array<{ id: string; score: number; feedback: string }>; overall?: number };
        const results = (parsed.results ?? []).map((r) => {
          const q = questions.find((x) => x.id === r.id);
          return {
            ...r,
            referenceAnswer: q?.referenceAnswer ?? "",
            userAnswer: answers[r.id] ?? ""
          };
        });
        const overall = typeof parsed.overall === "number" ? parsed.overall : (results.reduce((a, r) => a + (r.score || 0), 0) / Math.max(1, results.length));
        return NextResponse.json({ results, overall });
      } catch {
        const results = questions.map((q) => ({
          id: q.id,
          score: 60,
          feedback: "Respuesta razonable. Añade definiciones y ejemplos del material.",
          referenceAnswer: q.referenceAnswer,
          userAnswer: answers[q.id] ?? ""
        }));
        const overall = results.reduce((a, r) => a + r.score, 0) / results.length;
        return NextResponse.json({ results, overall });
      }
    }

    return NextResponse.json({ error: "mode_not_supported" }, { status: 400 });
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


