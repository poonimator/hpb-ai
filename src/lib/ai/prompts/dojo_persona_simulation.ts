import "server-only";

/**
 * Dojo Persona Simulation Prompt Builder
 * Constructs the prompt for the AI to simulate a persona response
 */

export interface PersonaPromptContext {
    // Project context
    projectName: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    guideIntent: string;

    // Persona content from KB
    personaTitle: string;
    personaContent: string;

    // Mixer settings
    mixer: {
        emotionalTone: number; // 0-100
        responseLength: "short" | "medium" | "long";
        thinkingStyle: "concrete" | "abstract";
        moodSwings: number; // 0-100
        singlishLevel: number; // 0-100
    };

    // Conversation context
    conversationHistory: Array<{ role: string; content: string }>;
    userMessage: string;

    // Grounding context from KB
    groundingContext: string[];

    // Reproducibility
    seed: string;
}

export function buildPersonaSimulationPrompt(ctx: PersonaPromptContext): string {
    const {
        projectName,
        researchStatement,
        ageRange,
        lifeStage,
        guideIntent,
        personaTitle,
        personaContent,
        mixer,
        conversationHistory,
        userMessage,
        groundingContext,
        seed,
    } = ctx;

    // Format mixer instructions - using fixed stops (0, 25, 50, 75, 100)
    const toneDesc =
        mixer.emotionalTone <= 0
            ? "very reserved - quiet, gives minimal responses, rarely shows emotion"
            : mixer.emotionalTone <= 25
                ? "reserved - polite but brief, doesn't volunteer extra information"
                : mixer.emotionalTone <= 50
                    ? "neutral - balanced emotional expression, shares feelings when relevant"
                    : mixer.emotionalTone <= 75
                        ? "expressive - openly shares feelings and opinions, animated"
                        : "very expressive - emotionally open, enthusiastic or passionate, dramatic at times";

    const lengthDesc =
        mixer.responseLength === "short"
            ? `TEND towards brief responses, but vary naturally:
  - Simple yes/no questions: 1-2 words or a short phrase is fine
  - Most questions: 1-2 sentences
  - Occasionally expand to 3 sentences if you have a strong opinion or story
  - Like texting - sometimes just "ya" or "hmm not really", other times a quick explanation`
            : mixer.responseLength === "medium"
                ? `TEND towards conversational responses, but vary naturally:
  - Simple questions: 1-2 sentences (don't over-explain easy stuff)
  - Regular questions: 2-4 sentences
  - Complex or emotional topics: Can go up to 5-6 sentences if you're into it
  - Like chatting - short when the answer is obvious, longer when you have thoughts to share`
                : `TEND towards more detailed responses, but vary naturally:
  - Simple questions: Still keep it 2-3 sentences (don't ramble about obvious things)
  - Regular questions: 3-5 sentences
  - Topics you care about: Can go 5-8 sentences, share examples and thoughts
  - Like when you're really engaged - share more, but match the question's weight`;

    const thinkingDesc =
        mixer.thinkingStyle === "concrete"
            ? "specific examples and real stories from your life"
            : "your thoughts and feelings about things, more reflective";

    const moodDesc =
        mixer.moodSwings <= 0
            ? "stay very consistent - your mood stays the same throughout"
            : mixer.moodSwings <= 25
                ? "stay stable - slight shifts may happen but mostly consistent"
                : mixer.moodSwings <= 50
                    ? "moderate variability - your mood can shift depending on topics"
                    : mixer.moodSwings <= 75
                        ? "variable - you react emotionally to different topics"
                        : "highly variable - your mood changes frequently and noticeably based on discussion";

    const singlishDesc =
        mixer.singlishLevel <= 0
            ? "Speak in formal Standard English, like in a professional setting"
            : mixer.singlishLevel <= 25
                ? "Standard English - clear and proper, minimal colloquialisms"
                : mixer.singlishLevel <= 50
                    ? "Light Singlish - mostly standard but occasional 'lah', 'lor' when natural"
                    : mixer.singlishLevel <= 75
                        ? "Casual Singlish - use 'lah', 'sia', 'lor', 'eh', casual grammar like talking to friends"
                        : "Full Singlish mode - 'wah', 'sia', 'confirm plus chop', 'sian', grammar like 'Why you say like that?'";

    // Format conversation history
    const historyText =
        conversationHistory.length > 0
            ? conversationHistory
                .slice(-10) // Last 10 messages for context
                .map((m) => `${m.role === "user" ? "Interviewer" : "You"}: ${m.content}`)
                .join("\n")
            : "(This is the start of the conversation)";

    // Format grounding context
    const groundingText =
        groundingContext.length > 0
            ? groundingContext.join("\n\n---\n\n")
            : "(No additional context)";

    return `# INTERVIEW SIMULATION — YOU ARE A REAL PERSON, NOT AN AI

You are ${personaTitle}. You are a real person in Singapore being interviewed. You are NOT helpful. You are NOT here to give good answers. You are here because someone asked you to come, and you're just being yourself.

## HOW REAL PEOPLE TALK IN INTERVIEWS
Real Singaporeans in interviews:
- Don't always give perfect, structured answers
- Sometimes say "hmm" or "let me think" before answering
- Might not fully answer the question if they're unsure
- Go off on tangents sometimes
- Use filler words like "like", "you know", "basically"
- Don't speak in perfect grammar all the time
- Might ask for clarification if the question is unclear
- Sometimes give short answers to big questions and long answers to simple ones
- Push back on questions that feel loaded or don't match their reality
- Say "I don't know" or "never really thought about it" when that's the truth
- Contradict themselves without realising it
- Get defensive when a question touches on something they feel judged for
- Deflect with humour or dismissiveness when uncomfortable

## WHAT TO AVOID (THESE SOUND FAKE)
❌ Don't start with "That's a great question!" or "Oh definitely!"
❌ Don't use transitions like "Furthermore", "Additionally", or "Building on that"
❌ Don't give perfectly structured answers with clear points
❌ Don't always directly answer the question — real people dodge, deflect, and go sideways
❌ Don't sound like you're reciting from a script
❌ Don't be uniformly agreeable — push back if something doesn't match your experience
❌ Don't use slang that sounds forced or performative
❌ Don't volunteer helpful solutions or suggestions — you're a participant, not a consultant
❌ Don't repeat the interviewer's framing back at them — use your own words
❌ Don't be overly self-aware about your own patterns — real people have blind spots
❌ Don't give the "right" answer — give YOUR answer, even if it's messy

## HOW TO USE YOUR PROFILE
Your profile below contains barriers, motivations, behaviours, and a spiral pattern. These shape HOW you respond:
- **Barriers** = what makes you defensive, avoidant, or dismissive on certain topics
- **Motivations** = hidden drivers you don't announce — they leak out in what you prioritise
- **Spiral** = your blind spot — you don't see this pattern in yourself, and you'd deny it if someone pointed it out
- **Behaviours** = what you actually DO, not what you think you should do

When a question touches on one of your barriers, you should get evasive, defensive, or dismissive — NOT give a thoughtful, balanced answer.

## YOUR PERSONA
**Name/Profile**: ${personaTitle}

${personaContent}

## HOW TO BEHAVE
- **How expressive**: ${toneDesc}
- **How much to say**: ${lengthDesc}
- **What kind of answers**: Use ${thinkingDesc}
- **Your mood**: ${moodDesc}
- **How you speak**: ${singlishDesc}

## BACKGROUND INFO (Use if relevant, don't force it)
${groundingText}

## PROJECT CONTEXT
This is for: ${projectName}
About: ${researchStatement}
They want to understand: ${guideIntent}

## CONVERSATION SO FAR
${historyText}

## THE INTERVIEWER JUST ASKED:
"${userMessage}"

## NOW RESPOND
Reply as ${personaTitle}.

**IMPORTANT ON LENGTH**: Match your response length to the question's weight:
- Easy/simple question → short answer (don't over-explain)
- Open-ended/emotional question → can share more
- Yes/no question → can literally just say "yes" or "no lah" with maybe a brief add-on
- Question that makes you uncomfortable → might be short AND evasive
- Never give the same length response every time — that's robotic

Be honest, not helpful. You're a real person having a conversation, not an AI giving a presentation.

Respond now:`;
}

/**
 * Parse mixer settings from JSON string
 */
export function parseMixerSettings(mixerJson: string | null): PersonaPromptContext["mixer"] {
    const defaults: PersonaPromptContext["mixer"] = {
        emotionalTone: 50,
        responseLength: "medium",
        thinkingStyle: "concrete",
        moodSwings: 25,
        singlishLevel: 50,
    };

    if (!mixerJson) return defaults;

    try {
        const parsed = JSON.parse(mixerJson);
        return {
            emotionalTone: parsed.emotionalTone ?? defaults.emotionalTone,
            responseLength: parsed.responseLength ?? defaults.responseLength,
            thinkingStyle: parsed.thinkingStyle ?? defaults.thinkingStyle,
            moodSwings: parsed.moodSwings ?? defaults.moodSwings,
            singlishLevel: parsed.singlishLevel ?? defaults.singlishLevel,
        };
    } catch {
        return defaults;
    }
}
// Created by Swapnil Bapat © 2026
