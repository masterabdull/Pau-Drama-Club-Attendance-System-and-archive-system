CREATE TABLE "ArchiveVersion" (
    "id" TEXT NOT NULL,
    "archiveItemId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArchiveVersion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ArchiveVersion_archiveItemId_createdAt_idx" ON "ArchiveVersion"("archiveItemId", "createdAt");
ALTER TABLE "ArchiveVersion" ADD CONSTRAINT "ArchiveVersion_archiveItemId_fkey" FOREIGN KEY ("archiveItemId") REFERENCES "ArchiveItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;