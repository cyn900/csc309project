-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blog" (
    "bID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "Blog_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Blog" ("bID", "description", "title", "uID") SELECT "bID", "description", "title", "uID" FROM "Blog";
DROP TABLE "Blog";
ALTER TABLE "new_Blog" RENAME TO "Blog";
CREATE UNIQUE INDEX "Blog_title_key" ON "Blog"("title");
CREATE TABLE "new_Comment" (
    "cID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,
    CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment" ("cID") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("bID", "cID", "content", "hidden", "pID", "uID") SELECT "bID", "cID", "content", "hidden", "pID", "uID" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
