/**
 * One-time script to re-extract text from ProjectKbDocuments
 * that have storagePath but no extractedText.
 *
 * Usage: node fix-missing-text.mjs
 */
import { PrismaClient } from "./src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

function chunkText(text, chunkSize = 1000, overlap = 100) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

async function main() {
    // Find documents with no extracted text
    const docs = await prisma.projectKbDocument.findMany({
        where: {
            OR: [
                { extractedText: null },
                { extractedText: "" },
            ],
            mimeType: "application/pdf",
        },
        select: {
            id: true,
            title: true,
            storagePath: true,
            projectId: true,
        },
    });

    console.log(`Found ${docs.length} documents with missing text`);

    for (const doc of docs) {
        console.log(`\nProcessing: ${doc.title}`);

        // Resolve file path
        let filePath = doc.storagePath;
        if (!path.isAbsolute(filePath)) {
            filePath = path.join(process.cwd(), filePath);
        }

        if (!fs.existsSync(filePath)) {
            console.log(`  SKIP: File not found at ${filePath}`);
            continue;
        }

        try {
            const buffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            const text = pdfData.text ? pdfData.text.replace(/\0/g, "") : "";
            await parser.destroy();

            if (!text) {
                console.log(`  SKIP: No text extracted`);
                continue;
            }

            console.log(`  Extracted ${text.length} chars, ${pdfData.total} pages`);

            // Update document
            await prisma.projectKbDocument.update({
                where: { id: doc.id },
                data: { extractedText: text },
            });

            // Delete existing chunks (if any) and create new ones
            await prisma.projectKbChunk.deleteMany({ where: { documentId: doc.id } });
            const chunks = chunkText(text);
            if (chunks.length > 0) {
                await prisma.projectKbChunk.createMany({
                    data: chunks.map((content, index) => ({
                        documentId: doc.id,
                        chunkIndex: index,
                        content,
                    })),
                });
            }

            console.log(`  OK: Updated with ${chunks.length} chunks`);
        } catch (err) {
            console.error(`  ERROR: ${err.message}`);
        }
    }

    await prisma.$disconnect();
    console.log("\nDone!");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
