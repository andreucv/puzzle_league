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
    echo "  --location <loc>     Database location: paris | west-virginia (default: west-virginia)"
    echo "  --generate-seed  (Re)generate seed_data.json using the data generator"
    echo "  --clean          Erase all data from the database"
    echo "  --seed           Insert data from seed_data.json"
    echo "  --seed-custom-users  Restore real users from real_seed_data.json (roles included)"
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
DO_SEED_CUSTOM_USERS=false
ADMIN_EMAIL=""
ORGANIZER_EMAIL=""
LOCATION="west-virginia"

while [ $# -gt 0 ]; do
    case "$1" in
        --location)
            if [ -z "$2" ] || [[ "$2" == --* ]]; then
                echo "Error: --location requires a value (paris|west-virginia)"
                usage
            fi
            LOCATION="$2"
            shift 2
            ;;
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
        --seed-custom-users)
            DO_SEED_CUSTOM_USERS=true
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

# ── Resolve location prefix ──────────────────────────────
case $LOCATION in
    paris)
        LOCATION_PREFIX="PARIS_"
        ;;
    west-virginia)
        LOCATION_PREFIX=""
        ;;
    *)
        echo "Error: Invalid location '$LOCATION'. Use paris or west-virginia"
        usage
        ;;
esac

echo "🌍 Location: ${LOCATION}"

# ── Set DATABASE_URL based on environment ────────────────
case $ENV in
    dev)
        VAR_NAME="${LOCATION_PREFIX}LOCAL_DATABASE_URL"
        DB_URL="${!VAR_NAME}"
        if [ -z "$DB_URL" ]; then
            echo "Error: $VAR_NAME is not set"
            exit 1
        fi
        export DATABASE_URL=$DB_URL
        echo "🔧 Targeting DEV environment..."
        ;;
    test)
        VAR_NAME="${LOCATION_PREFIX}TEST_DATABASE_URL"
        DB_URL="${!VAR_NAME}"
        if [ -z "$DB_URL" ]; then
            echo "Error: $VAR_NAME is not set"
            exit 1
        fi
        export DATABASE_URL=$DB_URL
        echo "🧪 Targeting TEST environment..."
        ;;
    prod)
        VAR_NAME="${LOCATION_PREFIX}PROD_DATABASE_URL"
        DB_URL="${!VAR_NAME}"
        if [ -z "$DB_URL" ]; then
            echo "Error: $VAR_NAME is not set"
            exit 1
        fi
        export DATABASE_URL=$DB_URL
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

if [ "$DO_SEED_CUSTOM_USERS" = true ]; then
    echo "👤 Restoring custom users from real_seed_data.json..."
    DATABASE_URL=$DATABASE_URL npx tsx "$SCRIPT_DIR/action_seed_custom_users.ts"
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
