import prisma from "@/lib/db/prisma";
import { logAuditBatch } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

// GET /api/seed - Seed the database with sample personas
export async function GET() {
    try {
        // Check if personas already exist
        const existingPersonas = await prisma.persona.count();

        if (existingPersonas > 0) {
            return successResponse({
                message: "Database already seeded",
                personaCount: existingPersonas,
            });
        }

        // Create sample personas for Singapore youth demographics
        const personas = await prisma.persona.createMany({
            data: [
                {
                    name: "Sec 3 Student",
                    ageRange: "13-17",
                    lifeStage: "Secondary",
                    description: "A typical Secondary 3 student in Singapore. Enjoys social media, gaming, and hanging out with friends. Balancing school work with CCA commitments. Sometimes feels stressed about exams but generally optimistic about the future.",
                    singlishLevelDefault: 0.7,
                },
                {
                    name: "JC1 Student",
                    ageRange: "17-19",
                    lifeStage: "JC",
                    description: "A Junior College Year 1 student adapting to the rigorous academic environment. Passionate about pursuing a specific field but uncertain about career paths. Active in student council and volunteer activities.",
                    singlishLevelDefault: 0.5,
                },
                {
                    name: "Poly Student",
                    ageRange: "17-20",
                    lifeStage: "Polytechnic",
                    description: "A Polytechnic student studying a hands-on diploma course. More career-focused than peers in JC. Has part-time work experience and interested in starting side hustles. Practical and grounded outlook.",
                    singlishLevelDefault: 0.6,
                },
                {
                    name: "NSF (Full-time NS)",
                    ageRange: "18-20",
                    lifeStage: "NS",
                    description: "Currently serving full-time National Service. Experiencing significant life transition and responsibility. Thinking about university or work after NS. Values camaraderie and physical fitness.",
                    singlishLevelDefault: 0.75,
                },
                {
                    name: "University Freshman",
                    ageRange: "19-22",
                    lifeStage: "University",
                    description: "First-year university student navigating academic freedom and social independence. Exploring different interests through clubs and internships. Concerned about career prospects and adulting.",
                    singlishLevelDefault: 0.4,
                },
            ],
        });

        // Fetch created personas for audit log
        const createdPersonas = await prisma.persona.findMany();

        // Audit log
        await logAuditBatch(
            createdPersonas.map((p) => ({
                action: "CREATE" as const,
                entityType: "Persona",
                entityId: p.id,
                meta: { name: p.name, seeded: true },
            }))
        );

        return successResponse({
            message: "Database seeded successfully",
            personaCount: personas.count,
            personas: createdPersonas.map((p) => ({
                id: p.id,
                name: p.name,
                lifeStage: p.lifeStage,
            })),
        });
    } catch (error) {
        console.error("[API] GET /api/seed error:", error);
        return errorResponse("Failed to seed database", 500);
    }
}
// Created by Swapnil Bapat © 2026
