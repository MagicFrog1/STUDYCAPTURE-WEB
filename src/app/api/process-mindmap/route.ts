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
    simplicity: z.enum(["simple", "medio", "alto"]),
    definitions: z.enum(["breve", "media", "detallada"]),
    complexity: z.enum(["baja", "media", "alta"]),
    level: z.enum(["secundaria", "bachillerato", "universidad", "oposiciones"]),
  })
});

type MindmapNode = { title: string; note?: string; children?: MindmapNode[] };

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
    
    // Cargar pdf-parse on-demand
    let pdfParseFn: ((data: Buffer) => Promise<{ text: string }>) | null = null;
    for (const f of files.slice(0, 10)) {
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

    let topic = "Mapa mental";
    let nodes: MindmapNode[] = [];

    if (openai) {
      const instruction = `Eres StudyCaptures. Genera un mapa mental EN JSON a partir de las imágenes de apuntes.

REQUISITOS:
- Devuelve SOLO JSON válido sin markdown.
- Estructura:
{
  "topic": "Tema principal",
  "nodes": [ { "title": "", "note": "", "children": [ ... ] } ]
}
- Nivel académico: ${options.level}.
- Nivel de simplicidad: ${options.simplicity} (más simple → menos nodos/ramas).
- Grado de definiciones: ${options.definitions} (breve/media/detallada en "note").
- Grado de complejidad: ${options.complexity} (profundidad y relaciones).
- Mantén títulos y notas concisos y pedagógicos, en español.

CONTEXTO USUARIO (si existe):
${userContext || "(sin contexto)"}
`;

      let finalInstruction = instruction;
      
      // Add PDF texts if any
      if (pdfTexts.length > 0) {
        const joined = pdfTexts.join("\n\n---\n\n");
        const truncated = joined.slice(0, 12000);
        finalInstruction += `\n\nTEXTO EXTRAÍDO DE PDFs (usa estrictamente este contenido como base del mapa):\n${truncated}`;
      }
      
      const content = [
        { type: "text" as const, text: finalInstruction },
        ...images.map((img) => ({ type: "image_url" as const, image_url: { url: `data:${img.mime};base64,${img.b64}` } })),
      ];

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: options.complexity === "baja" ? 0.3 : options.complexity === "media" ? 0.5 : 0.7,
        max_tokens: 3000,
      });
      let raw = resp.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```json\n?/i, "").replace(/```$/g, "").trim();
      try {
        const parsed = JSON.parse(raw) as { topic?: string; nodes?: MindmapNode[] };
        topic = parsed.topic || topic;
        nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
      } catch {
        // Fallback mínimo si el JSON falla
        topic = "Mapa mental (demo)";
        nodes = [
          { title: "Concepto A", note: "Definición breve", children: [ { title: "A1" }, { title: "A2" } ] },
          { title: "Concepto B", children: [ { title: "B1" }, { title: "B2" } ] }
        ];
      }
    } else {
      // Sin API key: demo
      topic = "Mapa mental (demo)";
      nodes = [
        { title: "Tema 1", note: "Resumen", children: [ { title: "Idea 1" }, { title: "Idea 2" } ] },
        { title: "Tema 2", children: [ { title: "Relación 1" }, { title: "Relación 2" } ] }
      ];
    }

    return NextResponse.json({ topic, nodes });
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


