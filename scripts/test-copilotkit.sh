#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000/api/copilotkit"

echo -e "${BLUE}🧪 Testing /api/copilotkit endpoint${NC}\n"

# Test GET - Info
echo -e "${GREEN}Test: GET Endpoint Info${NC}"
curl -X GET "$API_URL" -s | jq '.'

echo -e "\n${BLUE}ℹ️  Note: Full POST testing requires CopilotKit frontend integration${NC}"
echo -e "${BLUE}The endpoint is designed to be consumed by CopilotKit React components${NC}"
