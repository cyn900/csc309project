// Create a function to read input using process.stdin
function getInput() {
    return new Promise(function (resolve) {
        process.stdout.write("Enter something: ");
        process.stdin.once("data", function (data) {
            resolve(data.toString().trim()); // Convert input buffer to string
            process.stdin.pause(); // End the input stream
        });
    });
}
// Usage of getInput function
getInput().then(function (userInput) {
    console.log("You entered: ".concat(userInput));
});
