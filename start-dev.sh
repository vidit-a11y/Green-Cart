#!/bin/bash

# Kill existing processes on ports 5001 and 5173
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Starting GreenCart servers..."

# Start server
cd /Users/vidit/Desktop/Green-Cart/server
npm run dev &
SERVER_PID=$!

# Start client
cd /Users/vidit/Desktop/Green-Cart/client
npm run dev &
CLIENT_PID=$!

echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "GreenCart is starting..."
echo "Server will run on http://localhost:5001"
echo "Client will run on http://localhost:5173"

# Wait for both processes
wait $SERVER_PID
wait $CLIENT_PID
