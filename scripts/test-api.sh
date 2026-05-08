#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api/analyze"

echo -e "${BLUE}🧪 Testing /api/analyze endpoint${NC}\n"

# Test 1: Travel
echo -e "${GREEN}Test 1: Travel Intent${NC}"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quiero viajar a Japón por una semana con $2000",
    "userId": "test-user-1"
  }' \
  -s | jq '.'

echo -e "\n"

# Test 2: Development
echo -e "${GREEN}Test 2: Development Intent${NC}"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cómo aprendo React en 3 meses, ya sé HTML y CSS",
    "userId": "test-user-2"
  }' \
  -s | jq '.'

echo -e "\n"

# Test 3: Fitness
echo -e "${GREEN}Test 3: Fitness Intent${NC}"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Necesito bajar 10kg en 2 meses, soy principiante",
    "userId": "test-user-3"
  }' \
  -s | jq '.'

echo -e "\n"

# Test 4: Invalid request (empty message)
echo -e "${GREEN}Test 4: Invalid Request${NC}"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "userId": "test-user-4"
  }' \
  -s | jq '.'

echo -e "\n"

# Test 5: GET endpoint info
echo -e "${GREEN}Test 5: GET Endpoint Info${NC}"
curl -X GET "$API_URL" -s | jq '.'

echo -e "\n${BLUE}✅ All tests completed${NC}"
