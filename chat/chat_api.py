import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import chatbot logic
from chat import gemini_model, generate, get_contents, load_books, model

app = FastAPI()

# Thêm cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load books once on server start
book_embeddings, book_metadata = load_books()
history = []


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(req: ChatRequest):
    global history
    user_query = req.message
    contents = get_contents(user_query, history, book_embeddings, book_metadata)
    response_text = generate(model, contents)
    history.append(user_query)
    history.append(response_text)
    return {"response": response_text}


# if __name__ == "__main__":
#     uvicorn.run("chatbot_api:app", host="0.0.0.0", port=8000, reload=True)
