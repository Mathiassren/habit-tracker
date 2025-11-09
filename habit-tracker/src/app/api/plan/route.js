import OpenAI from "openai";
import { createRouteHandlerClient } from "@/services/supabase/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Simple rate limiting (in-memory, resets on server restart)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute (lower for plan generation)

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

export async function POST(req) {
  try {
    // Check authentication
    const clientResult = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await clientResult.supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return Response.json(
        { ok: false, error: "Rate limit exceeded. Please try again in a minute." },
        { status: 429 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return Response.json(
        { 
          ok: false, 
          error: "Service unavailable" 
        },
        { status: 503 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      return Response.json(
        { ok: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Limit prompt length
    if (prompt.length > 500) {
      return Response.json(
        { ok: false, error: "Prompt is too long (max 500 characters)" },
        { status: 400 }
      );
    }

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
    
    // Provide more specific error messages
    let errorMessage = "Failed to create task plan.";
    if (e?.status === 401 || e?.code === 'invalid_api_key') {
      errorMessage = "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.";
    } else if (e?.message) {
      errorMessage = e.message;
    }
    
    return Response.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
