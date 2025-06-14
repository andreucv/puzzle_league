#!/bin/bash
# filepath: /Users/treus/repositories/puzzle_league/scripts/migrate.sh

# Exit on error
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Assuming the script is in the project root or a subdirectory
PROJECT_ROOT="$SCRIPT_DIR"

# Load .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/../.env" ]; then
    # Check parent directory if script is in a subdirectory
    echo "📄 Loading environment variables from ../.env file..."
    export $(cat "$PROJECT_ROOT/../.env" | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: No .env file found"
fi

# Function to display usage
usage() {
    echo "Usage: $0 [local|test|prod]"
    echo "  local - Apply migrations to LOCAL_DATABASE_URL"
    echo "  test  - Apply migrations to TEST_DATABASE_URL"
    echo "  prod  - Apply migrations to PROD_DATABASE_URL"
    exit 1
}

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo "Error: No environment specified"
    usage
fi

ENV=$1

# Set DATABASE_URL based on environment
case $ENV in
    local)
        if [ -z "$LOCAL_DATABASE_URL" ]; then
            echo "Error: LOCAL_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$LOCAL_DATABASE_URL
        echo "🔧 Applying migrations to LOCAL environment..."
        ;;
    test)
        if [ -z "$TEST_DATABASE_URL" ]; then
            echo "Error: TEST_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$TEST_DATABASE_URL
        echo "🧪 Applying migrations to TEST environment..."
        ;;
    prod)
        if [ -z "$PROD_DATABASE_URL" ]; then
            echo "Error: PROD_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$PROD_DATABASE_URL
        echo "🚀 Applying migrations to PRODUCTION environment..."

        # Extra confirmation for production
        read -p "⚠️  Are you sure you want to apply migrations to PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Migration cancelled"
            exit 0
        fi
        ;;
    *)
        echo "Error: Invalid environment '$ENV'"
        usage
        ;;
esac

# Display current database URL (masked for security)
echo "📍 Database: ${DATABASE_URL%%@*}@***"

# Deploy migrations
echo "🔄 Deploying migrations..."
npx prisma migrate deploy

# Optionally run seed (only for non-production)
if [ "$ENV" != "prod" ] && [ "$2" == "--seed" ]; then
    echo "🌱 Running seed..."
    npx prisma db seed
fi

echo "✅ Migration completed successfully for $ENV environment!"
