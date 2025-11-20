#!/bin/bash

# Virtual Trainer Setup Script (Simplified - No Sudo)
# This script automates the installation and configuration of the Virtual Trainer application

set -e

echo "=========================================="
echo "Virtual Trainer - Setup Script (Simplified)"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Step 2: Install frontend dependencies
echo ""
echo -e "${BLUE}Step 2: Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Step 3: Install backend dependencies
echo ""
echo -e "${BLUE}Step 3: Installing backend dependencies...${NC}"
cd virtual-trainer-backend
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Step 4: Create data directories and initial results file
echo ""
echo -e "${BLUE}Step 4: Creating data directories and initial results file...${NC}"
mkdir -p virtual-trainer-backend/data
if [ ! -f virtual-trainer-backend/data/results.json ]; then
    echo "[]" > virtual-trainer-backend/data/results.json
fi
echo -e "${GREEN}✓ Data directories and results.json ready${NC}"

# Step 5: Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the backend server:"
echo -e "   ${BLUE}cd virtual-trainer-backend && npm start${NC}"
echo ""
echo "2. In another terminal, start the frontend:"
echo -e "   ${BLUE}cd .. && npm run dev${NC}"
echo ""
echo "3. Open your browser and navigate to the address shown by 'npm run dev' (e.g., http://localhost:5173)${NC}"
echo ""
