/**
 * Data Migration Script: Migrate existing Projects to SubProject structure
 * 
 * This script:
 * 1. For each existing Project that has researchStatement/ageRange/lifeStage:
 *    - Creates a SubProject with the same name and those fields
 *    - Updates all GuideVersions to link to the new SubProject
 *    - Updates all Simulations to link to the new SubProject
 *    - Sets the Project's description to the researchStatement
 * 
 * Run with: npx tsx scripts/migrate-to-subprojects.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Starting migration to SubProject structure...\n');

    // 1. Get all projects that have the legacy fields (researchStatement is not null)
    const projects = await prisma.project.findMany({
        where: {
            researchStatement: { not: null }
        },
        include: {
            guideVersions: true,
            simulations: true,
        }
    });

    console.log(`Found ${projects.length} projects to migrate.\n`);

    for (const project of projects) {
        console.log(`📦 Migrating project: "${project.name}" (${project.id})`);

        // Skip if this project already has sub-projects (already migrated)
        const existingSubProjects = await prisma.subProject.count({
            where: { projectId: project.id }
        });

        if (existingSubProjects > 0) {
            console.log(`  ⏭️  Already has ${existingSubProjects} sub-project(s), skipping.\n`);
            continue;
        }

        // 2. Create SubProject with same name and legacy data
        const subProject = await prisma.subProject.create({
            data: {
                projectId: project.id,
                name: project.name, // Same name as parent
                researchStatement: project.researchStatement || '',
                ageRange: project.ageRange || '',
                lifeStage: project.lifeStage || '',
            }
        });
        console.log(`  ✅ Created SubProject: ${subProject.id}`);

        // 3. Update GuideVersions to link to SubProject
        const guideVersionResult = await prisma.guideVersion.updateMany({
            where: { projectId: project.id },
            data: { subProjectId: subProject.id }
        });
        console.log(`  ✅ Migrated ${guideVersionResult.count} guide version(s)`);

        // 4. Update Simulations to link to SubProject
        const simulationResult = await prisma.simulation.updateMany({
            where: { projectId: project.id },
            data: { subProjectId: subProject.id }
        });
        console.log(`  ✅ Migrated ${simulationResult.count} simulation(s)`);

        // 5. Set Project description from researchStatement
        await prisma.project.update({
            where: { id: project.id },
            data: {
                description: project.researchStatement || project.name
            }
        });
        console.log(`  ✅ Updated project description`);

        console.log(`  🎉 Migration complete for "${project.name}"\n`);
    }

    // Summary
    const totalSubProjects = await prisma.subProject.count();
    const totalProjects = await prisma.project.count();

    console.log('═══════════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   Total Projects: ${totalProjects}`);
    console.log(`   Total SubProjects: ${totalSubProjects}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('✅ Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
// Created by Swapnil Bapat © 2026
