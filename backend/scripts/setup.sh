#!/bin/bash
set -e

echo "=== Cognarc IT Backend Setup ==="
echo ""

cd "$(dirname "$0")/.."

echo "[1/3] Pushing database schema..."
npx prisma db push

echo ""
echo "[2/3] Seeding database..."
npx prisma db seed

echo ""
echo "[3/3] Building TypeScript..."
npx prisma generate && npx tsc

echo ""
echo "=== Setup complete ==="
