import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

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
    // Suscripción deshabilitada temporalmente para pruebas

    const form = await req.formData();
    const rawOptions = form.get("options");
    const files = form.getAll("files");
    const userContext = String(form.get("context") ?? "").trim();
    if (!rawOptions || files.length === 0) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const options = schema.shape.options.parse(JSON.parse(String(rawOptions)));

    // Convertir imágenes (máx 3) a base64
    const images: { mime: string; b64: string }[] = [];
    for (const f of files.slice(0, 3)) {
      if (typeof f === "string") continue;
      const arrayBuffer = await (f as File).arrayBuffer();
      const b64 = Buffer.from(arrayBuffer).toString("base64");
      images.push({ mime: (f as File).type, b64 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

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

      const content = [
        { type: "text" as const, text: instruction },
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


