import { NextRequest } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

const MODEL_NAME = "gpt-5.2";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentId, isProjectKb } = body;

        if (!documentId) {
            return errorResponse("Missing documentId", 400);
        }

        let doc;
        if (isProjectKb) {
            doc = await prisma.projectKbDocument.findUnique({
                where: { id: documentId },
                select: { id: true, extractedText: true, docType: true }
            });
        } else {
            doc = await prisma.kbDocument.findUnique({
                where: { id: documentId },
                select: { id: true, extractedText: true, docType: true }
            });
        }

        if (!doc) {
            return errorResponse("Document not found", 404);
        }

        if (doc.docType !== "PERSONA") {
            return errorResponse("Document is not a PERSONA type", 400);
        }

        if (!doc.extractedText) {
            return errorResponse("Document has no extracted text", 400);
        }

        // Check if API key is configured
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return errorResponse("OpenAI API not configured", 500);
        }

        const client = new OpenAI({ apiKey });

        const prompt = `Extract specific details from this persona document for a dashboard card. 
Keep all text concise, punchy, and suitable for a quick preview.

IMPORTANT NAMING RULES:
- The persona name may be a traditional human name (e.g., "Sarah", "John") OR an archetype/descriptive name (e.g., "The Experience Seeker", "The Reluctant Participant", "Digital Native")
- Use the FULL persona identifier as given in the document - do not shorten or extract just a first name if it's an archetype
- If the persona is named something like "The Adventure Seeker" or "Persona A", use that exact name

Focus on:
- Name: The persona's name or archetype identifier (use full name/title as given)
- Age: Their age (leave empty string "" if not specified or not applicable)
- Occupation: Their role or occupation (leave empty string "" if not specified or the persona is an archetype without a specific job)
- Summary: A 1-sentence overview of who they are
- Gains: What motivates them? (Max 15 words)
- Pains: What frustrates/challenges them? (Max 15 words)

Return JSON with these exact fields:
{
  "name": "<full persona name or archetype - e.g. 'Sarah' or 'The Experience Seeker'>",
  "age": "<age as string, or empty string if not applicable>",
  "occupation": "<role/job, or empty string if not applicable>",
  "summary": "<short 1-sentence bio>",
  "gains": "<concise gains summary>",
  "pains": "<concise pains summary>",
  "recommendedSettings": {
    "emotionalTone": <number: 0(Reserved) to 100(Expressive), steps of 25>,
    "moodSwings": <number: 0(Stable) to 100(Variable), steps of 25>,
    "singlishLevel": <number: 0(Formal) to 100(Full Singlish), steps of 25>,
    "responseLength": "<string: short, medium, or long>",
    "thinkingStyle": "<string: concrete or abstract>"
  }
}

Definitions for Settings:
- emotionalTone: 0=Very Reserved, 50=Neutral, 100=Very Expressive
- moodSwings: 0=Very Stable, 50=Moderate, 100=Highly Variable
- singlishLevel: 0=Formal English, 50=Light Singlish, 100=Full Singlish
- responseLength: short (<20 words), medium (20-60 words), long (>60 words)
- thinkingStyle: concrete (factual/direct), abstract (conceptual/metaphorical)

DOCUMENT:
${doc.extractedText.slice(0, 4000)}

Return ONLY the JSON object.`;

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
            console.error("[API] Failed to parse persona extraction:", text);
            return errorResponse("Failed to parse AI response", 500);
        }

        // Update the document with parsed metadata
        if (isProjectKb) {
            await prisma.projectKbDocument.update({
                where: { id: documentId },
                data: { parsedMetaJson: JSON.stringify(parsed) }
            });
        } else {
            await prisma.kbDocument.update({
                where: { id: documentId },
                data: { parsedMetaJson: JSON.stringify(parsed) }
            });
        }

        return successResponse({
            documentId,
            parsed,
            message: "Persona parsed successfully"
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/parse-persona error:", error);
        return errorResponse("Failed to parse persona", 500);
    }
}
// Created by Swapnil Bapat © 2026
