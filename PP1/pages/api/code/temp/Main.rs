use std::io;

fn main() {
    // Create a mutable string to store the input
    let mut input = String::new();
    
    // Print prompt message
    print!("Enter something: ");
    
    // Flush the output to ensure prompt appears
    io::stdout().flush().unwrap();
    
    // Read input from the user
    io::stdin().read_line(&mut input).expect("Failed to read line");
    
    // Remove the trailing newline character
    let input = input.trim();
    
    // Print the entered input
    println!("You entered: {}", input);
}
