#include <stdio.h>
#include <time.h>

int main() {
    // Get the current time
    time_t now = time(NULL);
    struct tm *local = localtime(&now);

    // Check if today is Saturday
    if (local->tm_wday == 6) { // 6 represents Saturday
        printf("It's a Saturday today!\n");
    } else {
        printf("It's not Saturday today.\n");
    }

    return 0;
}
