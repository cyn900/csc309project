const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@example.com";
  const password = "123p";
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        firstName: "Admin",
        lastName: "User",
        email: email,
        password: hashedPassword,
        avatar: null, // Optional, can be a URL if you have one
        phoneNum: null, // Optional, set to a phone number if needed
        role: "admin", // Set role to "admin" to match your model
        blogs: { connect: [] }, // Initialize relations as empty arrays if needed
        templates: { connect: [] },
        comments: { connect: [] },
        commentReports: { connect: [] },
        blogReports: { connect: [] },
        upvoted: { connect: [] },
        downvoted: { connect: [] },
        upvotedComment: { connect: [] },
        downvotedComment: { connect: [] },
      },
    });

    console.log("Admin account created:", admin);
  } catch (error) {
    console.error("Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
