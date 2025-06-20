import yaml
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Load config from config.yaml
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

# Extract MongoDB config
mongo_config = config["mongodb"]
username = mongo_config["user"]
password = mongo_config["pass"]
host = mongo_config["host"]
port = mongo_config["port"]

uri = f"mongodb://{username}:{password}@{host}:{port}/"

client = MongoClient(uri)
collection = client["bookstore"]["books"]
print("✅ Database connected")

model = SentenceTransformer("sentence-transformers/all-distilroberta-v1")
print("✅ Embedding model loaded")

books = list(
    collection.find(
        {},
        {
            "_id": 1,
            "title": 1,
            "author": 1,
            "description": 1,
            "price": 1,
            "stock": 1,
            "isbn": 1,
        },
    )
)
print(f"Found {len(books)} books")

# Embed all books and save results locally
embedded_books = []
for book in tqdm(books, desc="Embedding books"):
    title = book.get("title", "")
    author = book.get("author", "")
    description = book.get("description", "")
    price = book.get("price", "unknown price")
    stock = book.get("stock", "unknown stock")
    isbn = book.get("isbn", "unknown ISBN")

    price_text = f"Price: {price} dollars."
    stock_text = f"In stock: {stock} units."
    isbn_text = f"ISBN: {isbn}."

    text_to_embed = f"{title} by {author}. {description} {price_text} {stock_text} {isbn_text}"

    embedding = model.encode(text_to_embed).tolist()

    embedded_books.append({"_id": book["_id"], "embedding": embedding})

# Update MongoDB documents in a separate loop
for item in tqdm(embedded_books, desc="Updating database"):
    collection.update_one(
        {"_id": item["_id"]}, {"$set": {"embedding": item["embedding"]}}
    )

print("✅ Done embedding and updating all books.")
