import * as readline from "readline";

// Create an interface to read input and write output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask for user input and print it
rl.question("What is your name? ", (name) => {
    console.log(`Hello, ${name}!`);
    rl.close(); // Close the interface
});
