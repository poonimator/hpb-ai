
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sim = await prisma.simulation.findFirst({
        where: { endedAt: { not: null } },
        orderBy: { endedAt: 'desc' },
        include: { project: true }
    });

    if (sim) {
        console.log(`Found Simulation: ${sim.id}`);
        console.log(`Project: ${sim.project.name}`);
    } else {
        console.log("No completed simulation found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
// Created by Swapnil Bapat © 2026
