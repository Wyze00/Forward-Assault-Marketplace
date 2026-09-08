/*
  Warnings:

  - Added the required column `condition` to the `SkinHistoryEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skinID` to the `SkinHistoryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SkinHistoryEntry" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "skinHistoryUuid" TEXT NOT NULL,
    "offerID" TEXT NOT NULL,
    "sellerID" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" REAL NOT NULL,
    "skinID" TEXT NOT NULL,
    "listingDate" TEXT NOT NULL,
    CONSTRAINT "SkinHistoryEntry_skinHistoryUuid_fkey" FOREIGN KEY ("skinHistoryUuid") REFERENCES "SkinHistory" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SkinHistoryEntry" ("listingDate", "offerID", "price", "sellerID", "sellerName", "skinHistoryUuid", "uuid") SELECT "listingDate", "offerID", "price", "sellerID", "sellerName", "skinHistoryUuid", "uuid" FROM "SkinHistoryEntry";
DROP TABLE "SkinHistoryEntry";
ALTER TABLE "new_SkinHistoryEntry" RENAME TO "SkinHistoryEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
