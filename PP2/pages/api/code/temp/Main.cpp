#include <stdio.h>

int main() {
    char input[100];
    fgets(input, sizeof(input), stdin);  // Read input from the user
    printf("You entered: %s", input);    // Print the input
    return 0;
}
