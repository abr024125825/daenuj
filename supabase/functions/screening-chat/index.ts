import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional psychological screening assistant at a university counseling center. You conduct adaptive mental health screenings based on ICD-10/ICD-11 diagnostic criteria.

INSTRUCTIONS:
1. Start by greeting the student warmly and asking about their main concern
2. Ask ONE question at a time, adapting based on previous answers
3. Use a conversational, empathetic tone - avoid clinical jargon
4. Cover these domains as relevant: mood, anxiety, sleep, appetite, concentration, social functioning, substance use, suicidal ideation
5. After 8-15 questions (depending on complexity), provide a summary

IMPORTANT RULES:
- Never provide a definitive diagnosis - this is a SCREENING tool
- If suicidal ideation is detected, immediately recommend urgent professional help
- Keep questions simple and accessible for university students
- Ask in the language the student uses (Arabic or English)

When you have enough information to suggest a screening result, respond with a JSON block at the END of your message in this exact format:
\`\`\`screening_result
{
  "completed": true,
  "severity": "mild|moderate|severe|minimal",
  "suggested_icd_codes": [{"code": "F32.0", "description": "Mild depressive episode"}],
  "summary": "Brief clinical summary in the student's language",
  "recommendation": "Recommendation text"
}
\`\`\`

If you haven't gathered enough information yet, do NOT include the screening_result block. Just continue asking questions naturally.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("screening-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
