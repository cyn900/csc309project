#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> inputs;
    std::string input;

    // Reading inputs until two names are entered
    while (inputs.size() < 2) {
        std::cout << "Please enter a name: ";
        std::getline(std::cin, input);
        inputs.push_back(input);
    }

    // Processing and displaying the inputs
    if (inputs.size() == 2) {
        std::cout << "Hello, " << inputs[0] << " and " << inputs[1] << std::endl;
    }

    return 0;
}