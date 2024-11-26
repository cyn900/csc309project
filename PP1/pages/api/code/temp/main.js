"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var readline = require("readline");
// Create an interface to read input and write output
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Ask for user input and print it
rl.question("What is your name? ", function (name) {
    console.log("Hello, ".concat(name, "!"));
    rl.close(); // Close the interface
});
