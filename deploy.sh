#!/bin/bash
set -euo pipefail

echo "Building locally..."
npm run build

if [ ! -d ".next/standalone" ] || [ ! -d ".next/static" ]; then
  echo "Error: standalone build artifacts not found (.next/standalone or .next/static)."
  echo "Ensure next.config.ts has output: 'standalone' and the build succeeded."
  exit 1
fi

require_env() {
  local var_name="$1"
  if [ -z "${!var_name:-}" ]; then
    echo "Missing required env var: ${var_name}. Set it in your shell or .env."
    exit 1
  fi
}

require_env REMOTE_HOST
require_env REMOTE_DIR
require_env SERVICE_USER
require_env SERVICE_NAME

SWAP_SIZE_GB="${DEPLOY_SWAP_SIZE_GB:-2}"
SWAPFILE="/tmp/${SERVICE_NAME}.swap"
SWAP_SIZE_MB=$((SWAP_SIZE_GB * 1024))

echo "Syncing build artifacts to server..."
rsync -az --delete .next/standalone/ "${REMOTE_HOST}:${REMOTE_DIR}/.next/standalone/"
rsync -az --delete .next/static/ "${REMOTE_HOST}:${REMOTE_DIR}/.next/static/"
rsync -az --delete .next/static/ "${REMOTE_HOST}:${REMOTE_DIR}/.next/standalone/.next/static/"
rsync -az --delete public/ "${REMOTE_HOST}:${REMOTE_DIR}/public/"
rsync -az package.json package-lock.json "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Installing production deps on server and restarting..."
ssh "${REMOTE_HOST}" "
  set -euo pipefail
  cd \"${REMOTE_DIR}\"

  echo \"[deploy] creating temporary swap if missing...\"
  if [ ! -f \"${SWAPFILE}\" ]; then
    if command -v fallocate >/dev/null 2>&1; then
      sudo fallocate -l ${SWAP_SIZE_GB}G \"${SWAPFILE}\"
    else
      sudo dd if=/dev/zero of=\"${SWAPFILE}\" bs=1M count=${SWAP_SIZE_MB}
    fi
    sudo chmod 600 \"${SWAPFILE}\"
    sudo mkswap \"${SWAPFILE}\"
    sudo swapon \"${SWAPFILE}\"
  fi

  echo \"[deploy] installing prod deps (omit dev)...\"
  npm set progress=false
  NODE_OPTIONS=\"--max-old-space-size=512\" npm ci --omit=dev --prefer-offline --no-audit --no-fund

  echo \"[deploy] ensuring writable data dir...\"
  sudo mkdir -p data
  sudo chown ${SERVICE_USER}:${SERVICE_USER} data
  echo \"[deploy] ensuring writable image cache dir...\"
  sudo mkdir -p .next/standalone/.next/cache/images
  sudo chown -R ${SERVICE_USER}:${SERVICE_USER} .next/standalone/.next
  echo \"[deploy] ensuring writable static dir...\"
  sudo chown -R ${SERVICE_USER}:${SERVICE_USER} .next/static .next/standalone/.next/static

  echo \"[deploy] fixing native module for standalone...\"
  rm -rf .next/standalone/node_modules/better-sqlite3 || true
  mkdir -p .next/standalone/node_modules
  ln -s ../../node_modules/better-sqlite3 .next/standalone/node_modules/better-sqlite3
  rm -rf .next/standalone/node_modules/node-datachannel || true
  ln -s ../../node_modules/node-datachannel .next/standalone/node_modules/node-datachannel

  echo \"[deploy] restarting service...\"
  sudo systemctl restart ${SERVICE_NAME}

  echo \"[deploy] cleaning up temporary swap...\"
  if sudo swapoff \"${SWAPFILE}\"; then
    sudo rm -f \"${SWAPFILE}\"
  fi
"

echo "Done!"
