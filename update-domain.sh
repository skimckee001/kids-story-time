#!/bin/bash

# Update domain from kidsstorytime.org to kidsstorytime.ai

echo "Updating domain references from kidsstorytime.org to kidsstorytime.ai..."

# Find and replace in all relevant files
find . \( -name "*.html" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -exec sed -i.bak 's/kidsstorytime\.org/kidsstorytime.ai/g' {} +

# Remove backup files
find . -name "*.bak" -delete

echo "Domain update complete!"
echo "Files updated. Please review changes before committing."