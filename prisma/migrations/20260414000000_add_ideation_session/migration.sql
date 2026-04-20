-- CreateTable
CREATE TABLE "IdeationSession" (
    "id" TEXT NOT NULL,
    "subProjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SETUP',
    "sourceMappingId" TEXT NOT NULL,
    "sourceProfileIdsJson" TEXT,
    "focusAreasJson" TEXT,
    "resultJson" TEXT,
    "modelName" TEXT,
    "imageModelName" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdeationSession_subProjectId_createdAt_idx" ON "IdeationSession"("subProjectId", "createdAt");

-- AddForeignKey
ALTER TABLE "IdeationSession" ADD CONSTRAINT "IdeationSession_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
