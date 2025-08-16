#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Configure ngrok authtoken from the environment variable
if [ -n "$NGROK_AUTH_TOKEN" ]; then
  ngrok config add-authtoken $NGROK_AUTH_TOKEN
  echo "✅ ngrok authtoken configured."
else
  echo "⚠️ NGROK_AUTH_TOKEN not set. Using a temporary, unauthenticated ngrok session."
fi

# Start ngrok in the background to expose the Vite dev server port (8001)
echo "Starting ngrok tunnel for Vite dev server on port 8001..."
ngrok http 8001 --log=stdout &

# Wait a moment for ngrok to initialize and its API to be available
sleep 2

# Retrieve the public HTTPS URL from the ngrok API using a retry loop
echo "Fetching ngrok public URL..."
PUBLIC_URL=""
for i in {1..10}; do
  # Use curl to query the local ngrok API and jq to parse the https tunnel URL
  PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | .public_url')
  if [ -n "$PUBLIC_URL" ]; then
    break
  fi
  echo "Waiting for ngrok URL... (attempt $i)"
  sleep 2
done

if [ -z "$PUBLIC_URL" ]; then
  echo "❌ Error: Could not retrieve ngrok public URL after several attempts."
  exit 1
fi

# Export the URL so it can be used by the application if needed
export NGROK_URL=$PUBLIC_URL
echo "-----------------------------------------------------"
echo "🌍 Vite Dev Server accessible at: $NGROK_URL"
echo "-----------------------------------------------------"

# Execute the command passed to this script (the CMD from the Dockerfile)
# This will run 'npm start' and start the Vite server
echo "Executing main application command: $@"
exec "$@"
