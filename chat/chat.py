import google.generativeai as genai
import numpy as np
import yaml

# from google import genai
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

# Cấu hình Gemini API
genai.configure(api_key=api_key)
model = genai.GenerativeModel(gemini_model)

# MongoDB setup
uri = f"mongodb://{username}:{password}@{host}:{port}/"
client = MongoClient(uri)
collection = client["bookstore"]["books"]
print("✅ MongoDB connected")

# Embedding model
embedder = SentenceTransformer("sentence-transformers/all-distilroberta-v1")
print("✅ Embedding model loaded")

# Gemini model


def generate(model, contents):
    response = model.generate_content(contents)
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


def get_contents(query, history, book_embeddings, book_metadata):
    top_indices = search_books(query, book_embeddings, 5)
    book_context = "\n\n".join(
        [format_book_entry(book_metadata[i]) for i in top_indices]
    )
    book_context = "Here are some relevant books:\n\n" + book_context
    contents = []
    if history:
        contents.extend(history)
    contents.append(book_context)
    contents.append(query)
    return contents


def load_books():
    books = list(
        collection.find(
            {"embedding": {"$exists": True}},
            {
                "title": 1,
                "author": 1,
                "description": 1,
                "price": 1,
                "isbn": 1,
                "stock": 1,
                "embedding": 1,
            },
        )
    )
    # Xác định độ dài embedding chuẩn
    embedding_lengths = [
        len(book["embedding"])
        for book in books
        if book.get("embedding") is not None
    ]
    if not embedding_lengths:
        print("❌ Không tìm thấy embedding hợp lệ nào trong database.")
        return np.array([]), []
    expected_length = max(set(embedding_lengths), key=embedding_lengths.count)
    # Lọc các book có embedding đúng độ dài
    valid_books = []
    invalid_count = 0
    for i, book in enumerate(books):
        emb = book.get("embedding")
        if emb is not None and len(emb) == expected_length:
            valid_books.append(book)
        else:
            invalid_count += 1
            print(
                f"⚠️ Book ở vị trí {i} có embedding không hợp lệ: {len(emb) if emb is not None else 'None'}"
            )
    if invalid_count > 0:
        print(
            f"⚠️ Tổng số book bị loại do embedding không hợp lệ: {invalid_count}"
        )
    book_embeddings = np.array([book["embedding"] for book in valid_books])
    book_metadata = [
        {
            "title": book.get("title", "Unknown Title"),
            "author": book.get("author", "Unknown Author"),
            "description": book.get("description", "No description available."),
            "price": book.get("price", "N/A"),
            "stock": book.get("stock", "N/A"),
            "isbn": book.get("isbn", "N/A"),
        }
        for book in valid_books
    ]
    return book_embeddings, book_metadata


# if __name__ == "__main__":
#     history = []
#     book_embeddings, book_metadata = load_books()
#
#     while True:
#         user_query = input("you: ")
#
#         contents = get_contents(user_query, history, book_embeddings, book_metadata)
#         response_text = generate(model, contents)
#
#         # Update history
#         history.append(user_query)
#         history.append(response_text)
#
#         print("model:", response_text)
