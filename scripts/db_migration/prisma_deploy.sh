#!/bin/bash

# Exit on error
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT=${SCRIPT_DIR/\/scripts\/db_migration/}

# Load .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/../../.env" ]; then
    echo "📄 Loading environment variables from ../../.env file..."
    export $(cat "$PROJECT_ROOT/../../.env" | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: No .env file found"
fi

# ── Usage ────────────────────────────────────────────────
usage() {
    echo "Usage: $0 <env> [options]"
    echo ""
    echo "Environments:"
    echo "  dev   - Apply migrations to LOCAL_DATABASE_URL"
    echo "  test  - Apply migrations to TEST_DATABASE_URL"
    echo "  prod  - Apply migrations to PROD_DATABASE_URL"
    echo ""
    echo "Options (executed after migration, in this order):"
    echo "  --generate-seed  (Re)generate seed_data.json using the data generator"
    echo "  --clean          Erase all data from the database"
    echo "  --seed           Insert data from seed_data.json"
    echo "  --admin <email>      Grant ADMIN role to the given user"
    echo "  --organizer <email>  Grant ORGANIZER role to the given user"
    echo ""
    echo "Examples:"
    echo "  $0 dev                              # migrate only"
    echo "  $0 dev --clean --seed               # migrate, clean, then seed"
    echo "  $0 dev --admin user01@seed.local    # migrate, then grant admin"
    echo "  $0 dev --clean --seed --admin user01@seed.local --organizer user02@seed.local"
    exit 1
}

# ── Parse arguments ──────────────────────────────────────
if [ $# -eq 0 ]; then
    echo "Error: No environment specified"
    usage
fi

ENV=$1
shift

DO_GENERATE_SEED=false
DO_CLEAN=false
DO_SEED=false
ADMIN_EMAIL=""
ORGANIZER_EMAIL=""

while [ $# -gt 0 ]; do
    case "$1" in
        --generate-seed)
            DO_GENERATE_SEED=true
            shift
            ;;
        --clean)
            DO_CLEAN=true
            shift
            ;;
        --seed)
            DO_SEED=true
            shift
            ;;
        --admin)
            if [ -z "$2" ] || [[ "$2" == --* ]]; then
                echo "Error: --admin requires an email argument"
                usage
            fi
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --organizer)
            if [ -z "$2" ] || [[ "$2" == --* ]]; then
                echo "Error: --organizer requires an email argument"
                usage
            fi
            ORGANIZER_EMAIL="$2"
            shift 2
            ;;
        *)
            echo "Error: Unknown option '$1'"
            usage
            ;;
    esac
done

# ── Set DATABASE_URL based on environment ────────────────
case $ENV in
    dev)
        if [ -z "$LOCAL_DATABASE_URL" ]; then
            echo "Error: LOCAL_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$LOCAL_DATABASE_URL
        echo "🔧 Targeting DEV environment..."
        ;;
    test)
        if [ -z "$TEST_DATABASE_URL" ]; then
            echo "Error: TEST_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$TEST_DATABASE_URL
        echo "🧪 Targeting TEST environment..."
        ;;
    prod)
        if [ -z "$PROD_DATABASE_URL" ]; then
            echo "Error: PROD_DATABASE_URL is not set"
            exit 1
        fi
        export DATABASE_URL=$PROD_DATABASE_URL
        echo "🚀 Targeting PRODUCTION environment..."

        # Extra confirmation for production
        read -p "⚠️  Are you sure you want to proceed on PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Cancelled."
            exit 0
        fi
        ;;
    *)
        echo "Error: Invalid environment '$ENV'"
        usage
        ;;
esac

echo "📍 Database: ${ENV}"

# ── 1. Generate Prisma Client ───────────────────────────
echo "🔄 Generating Prisma Client..."
DATABASE_URL=$DATABASE_URL npx prisma generate

# ── 2. Deploy migrations (always mandatory) ─────────────
echo "🔄 Deploying migrations..."
DATABASE_URL=$DATABASE_URL npx prisma migrate deploy

# ── 3. Optional actions (in order: generate-seed → clean → seed → admin) ─
if [ "$DO_GENERATE_SEED" = true ]; then
    echo "🎲 Generating seed_data.json..."
    npx tsx "$SCRIPT_DIR/generate_seed_data.ts"
fi

if [ "$DO_CLEAN" = true ]; then
    echo "🧹 Cleaning database..."
    DATABASE_URL=$DATABASE_URL npx tsx "$SCRIPT_DIR/action_clean.ts"
fi

if [ "$DO_SEED" = true ]; then
    echo "🌱 Seeding database from seed_data.json..."
    DATABASE_URL=$DATABASE_URL npx tsx "$SCRIPT_DIR/action_seed.ts"
fi

if [ -n "$ADMIN_EMAIL" ]; then
    echo "👑 Granting admin to $ADMIN_EMAIL..."
    DATABASE_URL=$DATABASE_URL npx tsx "$SCRIPT_DIR/action_admin.ts" "$ADMIN_EMAIL"
fi

if [ -n "$ORGANIZER_EMAIL" ]; then
    echo "📋 Granting organizer to $ORGANIZER_EMAIL..."
    DATABASE_URL=$DATABASE_URL npx tsx "$SCRIPT_DIR/action_organizer.ts" "$ORGANIZER_EMAIL"
fi

echo "✅ Done! ($ENV environment)"

# Regenerate Prisma Client for local dev
DATABASE_URL=$LOCAL_DATABASE_URL npx prisma generate
