/*
  Warnings:

  - You are about to drop the column `tID` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `downvote` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upvote` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "_UpvotesComment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UpvotesComment_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment" ("cID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UpvotesComment_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("uID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DownvotesComment" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_DownvotesComment_A_fkey" FOREIGN KEY ("A") REFERENCES "Comment" ("cID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DownvotesComment_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("uID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "cID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hidden" BOOLEAN NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,
    "upvote" INTEGER NOT NULL,
    "downvote" INTEGER NOT NULL,
    CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment" ("cID") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("bID", "cID", "hidden", "pID", "uID") SELECT "bID", "cID", "hidden", "pID", "uID" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_UpvotesComment_AB_unique" ON "_UpvotesComment"("A", "B");

-- CreateIndex
CREATE INDEX "_UpvotesComment_B_index" ON "_UpvotesComment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DownvotesComment_AB_unique" ON "_DownvotesComment"("A", "B");

-- CreateIndex
CREATE INDEX "_DownvotesComment_B_index" ON "_DownvotesComment"("B");
