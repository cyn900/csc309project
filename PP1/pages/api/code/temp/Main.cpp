int main() {
    const char message[] = "hello\n";
    for (const char* c = message; *c != '\0'; ++c) {
        __builtin_putchar(*c);
    }
    return 0;
}
