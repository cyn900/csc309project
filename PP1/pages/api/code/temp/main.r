# Open input.txt and read its contents
input_file <- file("stdin")
input <- readLines(input_file, warn = FALSE)
close(input_file)

# Output the content
cat("You entered:\n")
print(input)