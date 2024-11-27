use std::io;

fn main() {
    println!("Enter something:");

    // Create a mutable String to hold the input
    let mut input = String::new();

    // Read input from the standard input
    match io::stdin().read_line(&mut input) {
        Ok(_) => {
            println!("You entered: {}", input.trim());
        }
        Err(e) => {
            println!("Failed to read input: {}", e);
        }
    }
}
