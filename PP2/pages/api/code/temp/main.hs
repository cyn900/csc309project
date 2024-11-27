-- Import the necessary module for reading input
import System.IO

main :: IO ()
main = do
    -- Prompt the user for input
    putStrLn "Enter something: "
    
    -- Read the user input
    userInput <- getLine
    
    -- Print the entered input
    putStrLn ("You entered: " ++ userInput)
