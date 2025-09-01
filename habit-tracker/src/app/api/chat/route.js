import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages, // [{ role: "system"|"user"|"assistant", content: "..." }]
    });

    const text =
      completion?.choices?.[0]?.message?.content?.trim?.() || "No response.";

    return new Response(JSON.stringify({ ok: true, text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat route error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false, error: "Chat failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
