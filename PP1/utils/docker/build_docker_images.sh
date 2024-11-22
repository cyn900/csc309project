#!/bin/bash

# Define the list of programming languages
languages=("Python" "JavaScript" "Java" "C++" "C" "C#" "Go" "TypeScript" "Ruby" "PHP" "Swift" \
           "Kotlin" "Scala" "Perl" "Rust" "Bash" "MATLAB" "R" "Haskell" "Elixir")

# Iterate over each language
for language in "${languages[@]}"; do
  # Normalize the folder name (convert to lowercase and replace spaces/special characters)
  folder=$(echo "$language" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | sed 's/++/pp/g' | sed 's/#/sharp/g')

  echo "Building Docker image for $language..."

  # Check if the Dockerfile exists in the corresponding folder
  if [[ -f "$folder/Dockerfile" ]]; then
    # Build the Docker image and tag it using the normalized language name
    docker build -t "${folder}-image" "$folder" || {
      echo "Error building image for $language. Skipping."
      continue
    }
    echo "Successfully built image for $language: ${folder}-image"
  else
    echo "No Dockerfile found for $language in $folder/. Skipping."
  fi
done

echo "Docker image build process completed."
