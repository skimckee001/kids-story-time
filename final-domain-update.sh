#!/bin/bash

echo "Final comprehensive domain update from kidsstorytime.org to kidsstorytime.ai..."

# List of files that need updating
files=(
  "./terms.html"
  "./privacy.html"
  "./pricing-new.html"
  "./pricing-preview.html"
  "./public/pricing-new.html"
  "./public/pricing-preview.html"
  "./js/social-sharing-service.js"
  "./js/config-loader.js"
  "./src/App.complete.jsx"
  "./src/App.working.jsx"
  "./src/components/StoryDisplay.jsx"
  "./src/tests/tierFlowTests.js"
  "./test-tier-mapping.html"
)

# Update each file
for file in "${files[@]}"
do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    sed -i '' 's/kidsstorytime\.org/kidsstorytime.ai/g' "$file"
  fi
done

echo "Domain update complete!"
echo "Remember to rebuild the app with: npm run build"