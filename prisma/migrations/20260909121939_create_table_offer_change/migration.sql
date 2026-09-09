-- CreateTable
CREATE TABLE "SkinOfferChange" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinHistoryEntryUuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL,
    CONSTRAINT "SkinOfferChange_skinHistoryEntryUuid_fkey" FOREIGN KEY ("skinHistoryEntryUuid") REFERENCES "SkinHistoryEntry" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
