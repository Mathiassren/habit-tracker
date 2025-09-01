import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const sys = `
You turn a single human request into ONE actionable task card.
Return STRICT JSON only with the schema:
{
  "title": "short, action-oriented",
  "summary": "2–4 sentences: what and why",
  "priority": "low|medium|high|urgent",
  "status": "todo",
  "due_iso": "ISO8601 date or null",
  "tags": ["kebab-case", "..."],
  "steps": [{"title":"...", "done":false}, ...],
  "acceptance_criteria": ["clear, testable bullets"]
}
If info is missing, infer sensible defaults. Keep steps concrete and minimal.
`;

    const { choices } = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: prompt || "" },
      ],
      // Ask for JSON; we'll still guard with try/catch below.
      response_format: { type: "json_object" },
    });

    const raw = choices?.[0]?.message?.content || "{}";
    let task;
    try {
      task = JSON.parse(raw);
    } catch {
      task = {};
    }

    // Defensive defaults
    const now = new Date();
    const id = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const safe = {
      id,
      title: task.title || "Untitled task",
      summary: task.summary || "—",
      priority: ["low", "medium", "high", "urgent"].includes(task.priority)
        ? task.priority
        : "medium",
      status: "todo",
      due_iso: task.due_iso || null,
      tags: Array.isArray(task.tags) ? task.tags.slice(0, 8) : [],
      steps: Array.isArray(task.steps)
        ? task.steps
            .map((s) => ({ title: s.title || String(s), done: !!s.done }))
            .slice(0, 10)
        : [],
      acceptance_criteria: Array.isArray(task.acceptance_criteria)
        ? task.acceptance_criteria.slice(0, 8)
        : [],
      created_at: now.toISOString(),
    };

    return Response.json({ ok: true, task: safe });
  } catch (e) {
    console.error("plan route error:", e);
    return Response.json(
      { ok: false, error: "Planning failed" },
      { status: 500 }
    );
  }
}
