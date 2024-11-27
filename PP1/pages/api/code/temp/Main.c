#include <stdio.h>
#include <string.h>

int main() {
    char inputs[2][100]; // Array to store two names, each up to 99 characters long
    int count = 0;

    // Reading inputs until two names are entered
    while (count < 2) {
        printf("Please enter a name: ");
        fgets(inputs[count], sizeof(inputs[count]), stdin);
        // Remove newline character if it's read by fgets
        inputs[count][strcspn(inputs[count], "\n")] = '\0';
        count++;
    }

    // Processing and displaying the inputs
    if (count == 2) {
        printf("Hello, %s and %s\n", inputs[0], inputs[1]);
    }

    return 0;
}