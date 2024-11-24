FROM openjdk:latest

WORKDIR /app

# Create a placeholder Main.java
RUN echo "public class Main { public static void main(String[] args) { System.out.println(\"Hello, World!\"); } }" > Main.java

# Compile the placeholder Main.java
RUN javac Main.java

CMD ["java", "Main"]
