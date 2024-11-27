import java.util.Scanner;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        ArrayList<String> inputs = new ArrayList<>();

        // Reading inputs
        while(inputs.size() < 2) {
            System.out.println("Please enter a name:");
            inputs.add(scanner.nextLine());
        }

        // Processing and displaying the inputs
        if (inputs.size() == 2) {
            System.out.println("Hello, " + inputs.get(0) + " and " + inputs.get(1));
        }

        scanner.close();
    }
}