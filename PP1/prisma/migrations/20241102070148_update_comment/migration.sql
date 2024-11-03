/*
  Warnings:

  - Added the required column `content` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "cID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hidden" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,
    "upvote" INTEGER NOT NULL,
    "downvote" INTEGER NOT NULL,
    CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment" ("cID") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("bID", "cID", "downvote", "hidden", "pID", "uID", "upvote") SELECT "bID", "cID", "downvote", "hidden", "pID", "uID", "upvote" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
