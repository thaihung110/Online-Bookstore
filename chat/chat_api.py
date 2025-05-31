import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel

# Import chatbot logic
from chat import generate, get_contents, load_books, to_content, genai_client, gemini_model

app = FastAPI()

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
    response_text = generate(genai_client, gemini_model, contents)
    history.append(to_content("user", user_query))
    history.append(to_content("model", response_text))
    return {"response": response_text}

if __name__ == "__main__":
    uvicorn.run("chatbot_api:app", host="0.0.0.0", port=8000, reload=True)
