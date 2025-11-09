import OpenAI from "openai";
import { createRouteHandlerClient } from "@/services/supabase/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple rate limiting (in-memory, resets on server restart)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Filter out requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  return true; // Within rate limit
}

export async function POST(req) {
  try {
    // Check authentication
    const clientResult = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await clientResult.supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Rate limit exceeded. Please try again in a minute." 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(
        JSON.stringify({ ok: false, error: "Service unavailable" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // Validate input
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Messages are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Limit message length
    const totalLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    if (totalLength > 10000) {
      return new Response(
        JSON.stringify({ ok: false, error: "Message too long" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages, // [{ role: "system"|"user"|"assistant", content: "..." }]
      max_tokens: 500, // Limit response length
    });

    const text =
      completion?.choices?.[0]?.message?.content?.trim?.() || "No response.";

    return new Response(JSON.stringify({ ok: true, text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat route error:", err?.message || err);
    return new Response(
      JSON.stringify({ ok: false, error: "Chat service unavailable" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
