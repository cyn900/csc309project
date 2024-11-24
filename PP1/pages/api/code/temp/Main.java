import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) {
        // Create a BufferedReader for input
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

        System.out.print("Enter something: ");
        try {
            // Read input from the user
            String userInput = reader.readLine();

            // Print the input
            System.out.println("You entered: " + userInput);
        } catch (IOException e) {
            // Handle potential IO exceptions
            System.out.println("An error occurred while reading input.");
        }
    }
}
