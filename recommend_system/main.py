from typing import List

import numpy as np
from bson import ObjectId
from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from RecommendSystem import RecommendSystem

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
# uvicorn main:app --port 8080
app = FastAPI()

# Thêm đoạn này để bật CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối MongoDB
client = MongoClient(
    "mongodb://dungta:dungta1234@64.23.233.24:27017/bookstore?authSource=admin"
)
print("Connected to MongoDB")
db = client["bookstore"]
books_collection = db["books"]
recommend_system = RecommendSystem(
    db_uri="mongodb://dungta:dungta1234@64.23.233.24:27017/bookstore?authSource=admin",
    db_name="bookstore",
)
# recommend_system.fit(n_factors=20, lr=0.01, reg=0.01, n_epochs=100)


@app.post("/rating")
async def add_rating(
    user_id: str = Body(...),
    book_id: str = Body(...),
    rating: float = Body(...),
    created_at: str = Body(
        ..., description="Timestamp of the rating in ISO format"
    ),
):
    rating_col = db["user_rating"]

    past_ratings = rating_col.find_one({"user_id": user_id, "book_id": book_id})

    if past_ratings:
        # Nếu đã có rating, cập nhật rating mới
        rating_col.update_one(
            {"user_id": user_id, "book_id": book_id},
            {"$set": {"rating": rating, "created_at": created_at}},
        )
        print(f"Updated rating for user {user_id} and book {book_id}.")

        return {
            "status": "updated",
            "message": f"Rating updated for user {user_id} and book {book_id}.",
        }

    rating_col.insert_one(
        {
            "user_id": user_id,
            "book_id": book_id,
            "rating": rating,
            "created_at": created_at,
        }
    )
    return {
        "status": "success",
        "message": f"Rating added for user {user_id} and book {book_id}.",
    }


@app.get("/recommend/books/{user_id}")
async def recommend_books(
    user_id: str,
    top_k: int = Query(5, description="Number of recommendations to return"),
):
    recommendations = []
    try:
        print(f"Recommending books for user {user_id} with top_k={top_k}")
        recommendations = recommend_system.recommend(user_id, top_k=top_k)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/book/batch")
async def recommend_books_batch():
    try:
        print("Batch updating recommendations...")
        recommend_system.batch_update()
        return {"status": "success", "message": "Batch update completed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def mongo_book_to_dict(book):
    # Chuyển ObjectId và các trường đặc biệt sang string
    result = {}
    for k, v in book.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        else:
            result[k] = v
    return result


@app.get("/recommend/books/username/{username}")
async def recommend_books_by_username(
    username: str,
    top_k: int = Query(5, description="Number of recommendations to return"),
):
    try:
        user = db["test_insert_user"].find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        user_id = str(user["_id"])
        print(
            f"Recommending books for user {username} with user_id={user_id} and top_k={top_k}"
        )
        recommendations = recommend_system.recommend(user_id, top_k=top_k)
        if not recommendations:
            return []
        book_object_ids = [
            ObjectId(bid) for bid in recommendations if ObjectId.is_valid(bid)
        ]
        books_cursor = books_collection.find({"_id": {"$in": book_object_ids}})
        books_map = {str(book["_id"]): book for book in books_cursor}
        # Build result list in the same order as recommendations, skip missing, and serialize
        result = [
            mongo_book_to_dict(books_map[bid])
            for bid in recommendations
            if bid in books_map
        ]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check() -> dict:
    try:
        # Kiểm tra kết nối đến MongoDB
        client.admin.command("ping")
        return {"status": "ok", "message": "MongoDB connection is healthy."}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"MongoDB connection error: {str(e)}"
        )


# @app.get("/recommend/book/related")
# async def recommend_related_books(
#     book_id: str = Query(..., description="ID of the book to find related books for"),
#     user_id: str = Query(..., description="ID of the user requesting related books"),
#     top_k: int = Query(5, description="Number of related books to return")
#     ) -> List[dict]:
#     try:
#         # Lấy thông tin sách hiện tại
#         book = books_collection.find_one({"_id": ObjectId(book_id)})
#         if not book:
#             raise HTTPException(status_code=404, detail="Book not found.")

#         # Lấy thông tin người dùng hiện tại
#         user = db["users"].find_one({"_id": ObjectId(user_id)})
#         if not user:
#             raise HTTPException(status_code=404, detail="User not found.")

#         # Lấy danh sách sách mà người dùng hiện tại đã xem
#         user_interacted_books = set(user.get("viewed_books", []) + user.get("purchased_books", []) + user.get("wishlisted_books", []))

#         # Tìm những người dùng đã xem sách hiện tại
#         other_users = db["users"].find({"viewed_books": book_id})

#         # Lấy danh sách sách mà những người dùng đó đã xem
#         related_books = set()
#         for other_user in other_users:
#             other_user_books = set(other_user.get("viewed_books", []) + other_user.get("purchased_books", []) + other_user.get("wishlisted_books", []))
#             related_books.update(other_user_books - user_interacted_books)

#         # Lấy thông tin chi tiết của sách từ MongoDB
#         related_books_details = list(books_collection.find({"_id": {"$in": list(related_books)}}))

#         # Định dạng dữ liệu trả về
#         return [
#             {
#                 "id": str(book["_id"]),
#                 "title": book["title"],
#                 "author": book["author"],
#                 "genres": book["genres"],
#             }
#             for book in related_books_details[:top_k]
#         ]

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/book/related/author")
async def recommend_related_books(
    author: str = Body(
        ..., description="Author of the book to find related books for"
    ),
    top_k: int = Body(5, description="Number of related books to return"),
) -> List[dict]:
    try:
        books = books_collection.find({"author": author})
        if not books:
            raise HTTPException(
                status_code=404, detail="No books found for the given author."
            )
        random_books = books_collection.aggregate(
            [{"$sample": {"size": top_k}}]
        )
        related_books = []
        for book in random_books:
            related_books.append(
                {
                    "id": str(book["_id"]),
                    "title": book["title"],
                    "author": book["author"],
                    "genres": book["genres"],
                }
            )
        return related_books
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/book/related/genre")
async def recommend_related_books_by_genre(
    genre: str = Body(
        ..., description="Genre of the book to find related books for"
    ),
    top_k: int = Body(5, description="Number of related books to return"),
) -> List[dict]:
    try:
        books = books_collection.find({"genres": genre})
        if not books:
            raise HTTPException(
                status_code=404, detail="No books found for the given genre."
            )
        random_books = books_collection.aggregate(
            [{"$sample": {"size": top_k}}]
        )
        related_books = []
        for book in random_books:
            related_books.append(
                {
                    "id": str(book["_id"]),
                    "title": book["title"],
                    "author": book["author"],
                    "genres": book["genres"],
                }
            )
        return related_books
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
