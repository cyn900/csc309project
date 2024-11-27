# Use a Mono image that includes mcs
FROM mono:latest

# Set the working directory
WORKDIR /app

# Dynamically create Main.cs
RUN echo 'using System; class Program { static void Main() { Console.WriteLine("Hello, World!"); } }' > Main.cs

# Compile the C# application
RUN mcs -out:Main.exe Main.cs

# Command to execute the application
CMD ["mono", "Main.exe"]
