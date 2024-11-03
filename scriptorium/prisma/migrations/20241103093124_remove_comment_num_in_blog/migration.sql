/*
  Warnings:

  - You are about to drop the column `commentNum` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `hidden` on the `Blog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blog" (
    "bID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "Blog_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Blog" ("bID", "description", "title", "uID") SELECT "bID", "description", "title", "uID" FROM "Blog";
DROP TABLE "Blog";
ALTER TABLE "new_Blog" RENAME TO "Blog";
CREATE UNIQUE INDEX "Blog_title_key" ON "Blog"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
