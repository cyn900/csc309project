# Read input from stdin
inputs <- readLines(con = "stdin", n = -1)

# Print the inputs
if (length(inputs) == 0) {
  cat("No inputs provided!\n")
} else {
  cat("You entered:\n")
  cat(inputs, sep = "\n")
}
