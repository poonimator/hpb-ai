import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const otherDocs = await prisma.projectKbDocument.findMany({
        where: { projectId: 'cmk0jhumt0004c91cd76p159p', docType: 'OTHER' },
        select: { id: true, title: true, status: true, extractedText: true, _count: { select: { chunks: true } } }
    });
    console.log('OTHER docs:', otherDocs.length);
    otherDocs.forEach(d => console.log('  ', d.title, '| status:', d.status, '| text len:', d.extractedText?.length || 0, '| chunks:', d._count.chunks));

    const resDocs = await prisma.projectKbDocument.findMany({
        where: { projectId: 'cmk0jhumt0004c91cd76p159p', docType: 'RESEARCH' },
        select: { id: true, title: true, status: true, extractedText: true, _count: { select: { chunks: true } } }
    });
    console.log('\nRESEARCH docs:', resDocs.length);
    resDocs.forEach(d => console.log('  ', d.title, '| status:', d.status, '| text len:', d.extractedText?.length || 0, '| chunks:', d._count.chunks));

    await prisma.$disconnect();
}
check();
