package main

import (
	"fmt"
	"bufio"
	"os"
)

func main() {
	// Read input from the user
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')

	// Print the input
	fmt.Printf("You entered: %s", input)
}
