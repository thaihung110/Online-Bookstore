#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Online Bookstore Backend Setup${NC}"

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB connection...${NC}"
mongosh --eval "db.version()" --quiet > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: MongoDB is not running. Please start MongoDB first.${NC}"
  echo "You can start it with: docker-compose up -d mongo"
  exit 1
else
  echo -e "${GREEN}MongoDB is running.${NC}"
fi

# Run seed script
echo -e "${YELLOW}Running database seed script...${NC}"
npm run seed

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to seed the database.${NC}"
  exit 1
else
  echo -e "${GREEN}Database seed completed successfully.${NC}"
fi

# Start the backend server
echo -e "${YELLOW}Starting the backend server...${NC}"
echo -e "${GREEN}The server will be available at: http://localhost:4000/api${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server.${NC}"
npm run start:dev 