-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkinOfferChange" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinHistoryEntryUuid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkinOfferChange_skinHistoryEntryUuid_fkey" FOREIGN KEY ("skinHistoryEntryUuid") REFERENCES "SkinHistoryEntry" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SkinOfferChange" ("seen", "skinHistoryEntryUuid", "type", "uuid") SELECT "seen", "skinHistoryEntryUuid", "type", "uuid" FROM "SkinOfferChange";
DROP TABLE "SkinOfferChange";
ALTER TABLE "new_SkinOfferChange" RENAME TO "SkinOfferChange";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
