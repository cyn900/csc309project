// input example: ["a", "b"]
const readline = require('readline');

// Create a readline interface for input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let inputs = [];

// Listen for each line of input
rl.on('line', (input) => {
  inputs.push(input); // Add the input to the array

  // Check if two inputs have been received
  if (inputs.length === 2) {
    console.log(`Hello, ${inputs[0]} and ${inputs[1]}`); // Process and display the inputs
    rl.close(); // Close the readline interface
  }
});