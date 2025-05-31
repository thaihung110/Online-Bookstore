import numpy as np
import yaml
from google import genai
from google.genai import types
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load YAML config
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

# MongoDB config
username = config["mongodb"]["user"]
password = config["mongodb"]["pass"]
host = config["mongodb"]["host"]
port = config["mongodb"]["port"]

# Gemini config
api_key = config["gemini"]["api_key"]
gemini_model = config["gemini"]["model"]
system_prompt = config["gemini"]["system_prompt"]

# MongoDB setup
uri = f"mongodb://{username}:{password}@{host}:{port}/"
client = MongoClient(uri)
collection = client["bookstore"]["books"]
print("✅ MongoDB connected")

# Embedding model
embedder = SentenceTransformer("sentence-transformers/all-distilroberta-v1")
print("✅ Embedding model loaded")

# Gemini model
genai_client = genai.Client(api_key=api_key)


def generate(client, model_name, contents):
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(text=system_prompt),
        ],
    )
    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=generate_content_config
    )
    return response.text


def search_books(query, book_embeddings, top_k=5):
    query_embedding = embedder.encode(query).reshape(1, -1)
    similarities = cosine_similarity(query_embedding, book_embeddings)[0]
    top_indices = similarities.argsort()[-top_k:][::-1]
    return top_indices


def format_book_entry(book):
    return (
        f"Title: {book['title']}\n"
        f"Author: {book['author']}\n"
        f"Description: {book['description']}\n"
        f"Price: ${book['price']}\n"
        f"ISBN: {book['isbn']}\n"
    )


def to_content(role, text):
    return types.Content(role=role, parts=[types.Part.from_text(text=text)])


def get_contents(query, history, book_embeddings, book_metadata):
    top_indices = search_books(query, book_embeddings, 5)
    book_context = "\n\n".join([format_book_entry(book_metadata[i]) for i in top_indices])
    book_context = "Here are some relevant books:\n\n" + book_context
    contents = history.copy()
    contents.append(to_content("model", book_context))
    contents.append(to_content("user", query))
    return contents


def load_books():
    books = list(collection.find({"embedding": {"$exists": True}}, {
        "title": 1,
        "author": 1,
        "description": 1,
        "price": 1,
        "isbn": 1,
        "stock": 1,
        "embedding": 1
    }))
    book_embeddings = np.array([book["embedding"] for book in books])
    book_metadata = [
        {
            "title": book.get("title", "Unknown Title"),
            "author": book.get("author", "Unknown Author"),
            "description": book.get("description", "No description available."),
            "price": book.get("price", "N/A"),
            "stock": book.get("stock", "N/A"),
            "isbn": book.get("isbn", "N/A"),
        }
        for book in books
    ]
    return book_embeddings, book_metadata


if __name__ == "__main__":
    history = []
    book_embeddings, book_metadata = load_books()

    while True:
        user_query = input("you: ")

        contents = get_contents(user_query, history, book_embeddings, book_metadata)
        response_text = generate(genai_client, gemini_model, contents)

        # Update history
        history.append(to_content("user", user_query))
        history.append(to_content("model", response_text))

        print("model:", response_text)
