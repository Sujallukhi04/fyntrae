-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicUntil" TIMESTAMP(3),
    "shareSecret" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
