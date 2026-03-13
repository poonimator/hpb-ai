import { NextRequest } from "next/server";
import OpenAI from "openai";
import { successResponse, errorResponse } from "@/lib/validations";

const MODEL_NAME = "gpt-5.2";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { guideText } = body;

        if (!guideText || guideText.trim().length < 10) {
            return errorResponse("Please provide guide text to parse", 400);
        }

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return errorResponse("OpenAI API not configured", 500);
        }

        const client = new OpenAI({ apiKey });

        const prompt = `You are an expert at parsing moderator guides for qualitative research interviews. 
Parse the following guide text and extract it into a structured JSON format.

The moderator guide format has:
1. **Topic Sections (Question Sets)**: Each section has a title and covers a specific topic area
2. **What We Want to Uncover (Intent)**: The goal/purpose of that section - what insights we're trying to get
3. **Main Questions**: Primary interview questions for that section
4. **Follow-up/Probe Questions**: Sub-questions that dig deeper into main questions

CRITICAL RULE - PRESERVE ORIGINAL TEXT VERBATIM:
- DO NOT paraphrase, summarize, or rewrite ANY text
- Copy questions EXACTLY word-for-word as they appear in the source
- Copy section titles EXACTLY as written
- Copy intent/objectives EXACTLY as written
- If text appears in quotes, use that exact quoted text
- Do not improve grammar, shorten, or "clean up" any wording
- The only thing you are doing is STRUCTURING the text, not modifying it

PARSING RULES:
- Look for section headers, numbered items, or logical topic groupings
- Questions often start with "How", "What", "Why", "Can you", "Tell me about", etc.
- Follow-up questions are often indented, numbered differently (a, b, c or i, ii, iii), or introduced with "Probe:", "Follow-up:", or similar
- If a section has stated objectives/goals, copy that text verbatim as the "intent"
- If no clear intent is stated, leave the intent field empty (do not make one up)
- Create separate topic sections for distinctly different themes/topics

Return a JSON array with this exact structure:
[
  {
    "title": "<exact section title from source>",
    "intent": "<exact intent text from source, or empty string if none stated>",
    "questions": [
      {
        "text": "<exact main question text from source>",
        "subQuestions": [
          { "text": "<exact follow-up question from source>" }
        ]
      }
    ]
  }
]

GUIDE TEXT TO PARSE:
${guideText.slice(0, 8000)}

Return ONLY the JSON array, no other text.`;

        const result = await client.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "user", content: prompt }
            ],
        });

        const text = result.choices[0]?.message?.content || "";

        // Clean up the response (remove markdown code blocks if present)
        let jsonStr = text.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonStr.trim());
        } catch {
            console.error("[API] Failed to parse guide structure:", text);
            return errorResponse("Failed to parse the AI response. Please try again.", 500);
        }

        // Validate the structure
        if (!Array.isArray(parsed)) {
            return errorResponse("Invalid response format from AI", 500);
        }

        // Ensure each section has the required fields
        const validatedSections = parsed.map((section: any, index: number) => ({
            title: section.title || `Topic Section ${index + 1}`,
            intent: section.intent || "",
            questions: Array.isArray(section.questions) ? section.questions.map((q: any) => ({
                text: q.text || "",
                subQuestions: Array.isArray(q.subQuestions)
                    ? q.subQuestions.map((sq: any) => ({ text: sq.text || "" }))
                    : []
            })) : []
        }));

        return successResponse({
            sections: validatedSections,
            sectionCount: validatedSections.length,
            questionCount: validatedSections.reduce((acc: number, s: any) => acc + s.questions.length, 0),
            message: "Guide parsed successfully"
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/parse-guide error:", error);
        return errorResponse("Failed to parse guide", 500);
    }
}
// Created by Swapnil Bapat © 2026
