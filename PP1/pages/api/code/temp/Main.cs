using System;
using System.Collections.Generic;

class MainClass {
    public static void Main(string[] args) {
        List<string> inputs = new List<string>();

        // Reading inputs until two names are entered
        while (inputs.Count < 2) {
            Console.WriteLine("Please enter a name:");
            inputs.Add(Console.ReadLine());
        }

        // Processing and displaying the inputs
        if (inputs.Count == 2) {
            Console.WriteLine($"Hello, {inputs[0]} and {inputs[1]}");
        }
    }
}
