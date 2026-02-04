#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3000}"

# Print LAN IPs (excluding localhost)
IPS=$(/sbin/ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2}')

echo "Starting Jarvis Dashboard (LAN) on 0.0.0.0:${PORT}"
echo "Local:   http://localhost:${PORT}"
for ip in $IPS; do
  echo "Network: http://${ip}:${PORT}"
done

echo
exec npm run dev -- --hostname 0.0.0.0 --port "${PORT}"
