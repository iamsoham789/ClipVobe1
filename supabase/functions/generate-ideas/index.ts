import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();

    if (!category) {
      throw new Error("Category is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // Generate video ideas with Gemini API
    const systemMessage =
      "You are a YouTube Video Idea Expert. Suggest creative, trending, and viral video ideas that have high engagement potential.";
    const userInput = `Generate 5 creative and trending video ideas for YouTube in the ${category} category. Make them specific and compelling. Format each idea as a simple, clean sentence without any markdown formatting or special characters.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemMessage + "\n\n" + userInput }],
            },
          ],
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 500,
            responseMimeType: "text/plain",
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error calling Gemini API");
    }

    // Extract and format ideas
    const content = data.candidates[0].content.parts[0].text;
    const ideas = content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) => line.length > 0 && (line.match(/^\d+\./) || line.match(/^-/)),
      )
      .map((line) => {
        // Remove numbering and bullet points
        let cleanLine = line.replace(/^(\d+\.|-)/, "").trim();
        // Remove markdown formatting
        cleanLine = cleanLine
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1");
        return cleanLine;
      })
      .slice(0, 5); // Ensure we only return 5 ideas

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating ideas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
