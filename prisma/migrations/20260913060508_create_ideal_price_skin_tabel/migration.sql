-- CreateTable
CREATE TABLE "SkinIdealPrice" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "idealPrice" INTEGER,
    "shopPrice" INTEGER,
    "skinUuid" TEXT NOT NULL,
    CONSTRAINT "SkinIdealPrice_skinUuid_fkey" FOREIGN KEY ("skinUuid") REFERENCES "Skin" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SkinIdealPrice_skinUuid_key" ON "SkinIdealPrice"("skinUuid");
