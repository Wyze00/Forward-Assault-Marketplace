-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Camo" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "camoID" INTEGER NOT NULL,
    "camoName" TEXT NOT NULL
);
INSERT INTO "new_Camo" ("camoID", "camoName", "itemType", "uuid") SELECT "camoID", "camoName", "itemType", "uuid" FROM "Camo";
DROP TABLE "Camo";
ALTER TABLE "new_Camo" RENAME TO "Camo";
CREATE UNIQUE INDEX "Camo_itemType_camoID_key" ON "Camo"("itemType", "camoID");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
