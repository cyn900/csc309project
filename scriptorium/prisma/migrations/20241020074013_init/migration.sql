-- CreateTable
CREATE TABLE "User" (
    "uID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "phoneNum" INTEGER,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "tID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "code" TEXT,
    "fork" BOOLEAN NOT NULL,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "Template_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Blog" (
    "bID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "upvote" INTEGER NOT NULL,
    "downvote" INTEGER NOT NULL,
    "commentNum" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "Blog_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "cID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hidden" BOOLEAN NOT NULL,
    "uID" INTEGER NOT NULL,
    "bID" INTEGER NOT NULL,
    "pID" INTEGER,
    "tID" INTEGER,
    CONSTRAINT "Comment_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_pID_fkey" FOREIGN KEY ("pID") REFERENCES "Comment" ("cID") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_tID_fkey" FOREIGN KEY ("tID") REFERENCES "Template" ("tID") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentReport" (
    "crID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "explanation" TEXT NOT NULL,
    "cID" INTEGER NOT NULL,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "CommentReport_cID_fkey" FOREIGN KEY ("cID") REFERENCES "Comment" ("cID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommentReport_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogReport" (
    "brID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "explanation" TEXT NOT NULL,
    "bID" INTEGER NOT NULL,
    "uID" INTEGER NOT NULL,
    CONSTRAINT "BlogReport_bID_fkey" FOREIGN KEY ("bID") REFERENCES "Blog" ("bID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BlogReport_uID_fkey" FOREIGN KEY ("uID") REFERENCES "User" ("uID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TemplateTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TemplateTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TemplateTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Template" ("tID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BlogTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_BlogTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BlogTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BlogTemplates" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_BlogTemplates_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog" ("bID") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BlogTemplates_B_fkey" FOREIGN KEY ("B") REFERENCES "Template" ("tID") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_TemplateTags_AB_unique" ON "_TemplateTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TemplateTags_B_index" ON "_TemplateTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogTags_AB_unique" ON "_BlogTags"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogTags_B_index" ON "_BlogTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogTemplates_AB_unique" ON "_BlogTemplates"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogTemplates_B_index" ON "_BlogTemplates"("B");
