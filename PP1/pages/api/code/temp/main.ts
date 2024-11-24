// Create a function to read input using process.stdin
function getInput(): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write("Enter something: ");
    
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());  // Convert input buffer to string
      process.stdin.pause();  // End the input stream
    });
  });
}

// Usage of getInput function
getInput().then((userInput) => {
  console.log(`You entered: ${userInput}`);
});
