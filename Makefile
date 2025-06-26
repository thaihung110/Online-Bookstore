.PHONY: all backend frontend chatbot recommend

all: backend frontend chatbot recommend
	@echo "✅ All services started!"

backend:
	start cmd /k "cd backend && npm install && npm run start:dev"

frontend:
	start cmd /k "cd frontend && npm install && npm start"

# chatbot:
# 	start cmd /k "cd chat && uvicorn chat_api:app --port 8000 --reload"

# recommend:
# 	start cmd /k "cd recommend_system && uvicorn main:app --port 8081 --reload"
