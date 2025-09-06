#!/bin/bash

# Update Badges Script
# Run tests with coverage and generate new badges

set -e

echo "🧪 Running tests with coverage..."
pnpm test:coverage

echo "📊 Generating badges..."
node scripts/badge-generator.js

echo "✅ Badges updated successfully!"
echo ""
echo "Badge files generated:"
ls -la badges/

echo ""
echo "To commit the updated badges:"
echo "  git add badges/"
echo "  git commit -m 'chore: update badges'"