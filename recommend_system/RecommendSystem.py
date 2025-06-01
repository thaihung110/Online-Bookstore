from IncrementalMF import IncrementalMF
from pymongo import MongoClient
import numpy as np
import pickle
import os

class RecommendSystem:
    def __init__(self, db_uri, db_name):
        self.client = MongoClient(db_uri)
        self.db = self.client[db_name] 
        self.last_update_time = None  # Thời gian cập nhật cuối cùng
        self.model = None  # Mô hình sẽ được khởi tạo trong hàm fit
        

    def fit(self,n_factors = 20, lr = 0.01, reg = 0.01, n_epochs = 10):
        try:
            ratings_col = self.db["user_rating"]
            ratings_cursor = ratings_col.find({}, {"user_id": 1, "book_id": 1, "rating": 1,"created_at": 1})
            if not ratings_cursor:
                raise ValueError("No ratings found in the database.")
            
            ratings = []  # Only numeric: [user_index, item_index, rating]
            created_at_list = []  # Store created_at timestamps separately
            user_map = {}
            item_map = {}
            user_idx = 0
            item_idx = 0
            for doc in ratings_cursor:
                u = doc["user_id"]
                i = doc["book_id"]
                r = doc["rating"]
                c = doc["created_at"]

                # Map user_id và item_id sang chỉ số liên tục
                if u not in user_map:
                    user_map[u] = user_idx
                    user_idx += 1
                if i not in item_map:
                    item_map[i] = item_idx
                    item_idx += 1
                ratings.append([user_map[u], item_map[i], float(r)])  # Ensure numeric
                created_at_list.append(c)
            ratings = np.array(ratings, dtype=float)  # Ensure numeric dtype
            n_users = len(user_map)
            n_items = len(item_map)
            self.model = IncrementalMF(n_users, n_items, n_factors, lr, reg)
            if created_at_list:
                self.last_update_time = max(created_at_list)  # Cập nhật thời gian cuối cùng
            else:
                self.last_update_time = None

            
            
            if os.path.exists('mf_model.pkl'):
                self.model.load_model('mf_model.pkl')
            else:
                self.model.fit(ratings, n_epochs=n_epochs,last_update_time=self.last_update_time)
                self.model.save_model('mf_model.pkl')

            print(f"Model trained with {n_users} users and {n_items} items.")
            print(f"last update time: {self.model.last_update_time}")

            insert_user_inx  = []
            for u in user_map:
                insert_user_inx.append({"user_id": u, "user_index": user_map[u]})
            insert_item_inx = []
            for i in item_map:
                insert_item_inx.append({"book_id": i, "item_index": item_map[i]})

            # Lưu mapping user_id và item_id sang chỉ số liên tục vào MongoDB
            self.db["user_index"].insert_many(insert_user_inx)
            self.db["item_index"].insert_many(insert_item_inx)

        
        
        except ValueError as ve:
            print(f"ValueError during model training: {ve}")
        except Exception as e:
            print(f"Error during model training: {e}")
    def update(self, user_id, book_id, rating, created_at=None):
        try:
            if self.model is None:
                raise ValueError("Model has not been trained yet.")
            
            user_index = self.db["user_index"].find_one({"user_id": user_id})
            item_index = self.db["item_index"].find_one({"book_id": book_id})
            if user_index is None:
                user_count = int(self.db["user_index"].count_documents({}))  # Đếm số lượng user hiện tại

                # Thêm user mới vào user_index
                self.model.add_user()
                self.db["user_index"].insert_one({"user_id": user_id, "user_index": user_count})
                self.model.P = np.vstack([self.model.P, np.random.normal(0, 0.1, (1, self.model.n_factors))])
                self.model.bu = np.append(self.model.bu, 0)

                user_index = user_count  # Sử dụng chỉ số mới cho user
            else:
                user_index = user_index["user_index"]
                
            if item_index is None:
                item_count = int(self.db["item_index"].count_documents({}))
                self.model.add_item()
                self.db["item_index"].insert_one({"book_id": book_id, "item_index": item_count})
                self.model.Q = np.vstack([self.model.Q, np.random.normal(0, 0.1, (1, self.model.n_factors))])
                self.model.bi = np.append(self.model.bi, 0)
                item_index = item_count
            else:
                item_index = item_index["item_index"]
            self.model.update(user_index, item_index, rating,created_at)


            
        except Exception as e:
            print(f"Error during model update: {e}")
    def batch_update(self):
        self.model = IncrementalMF()
        self.model.load_model('mf_model.pkl')
        try:
            if self.model is None:
                raise ValueError("Model has not been trained yet.")
            ratings_col = self.db["user_rating"]
            # lay rating trong ngay gan nhat de update
            ratings = list(
                ratings_col.find(
                    {
                        "created_at": {"$gt": self.model.last_update_time}
                    }
                )
            )
            if not ratings:
                raise ValueError("No ratings found in the database.")
            ratings_array = np.array([[r["user_id"], r["book_id"], r["rating"],r["created_at"]] for r in ratings])
            for u,i,r,c in ratings_array:
                self.update(u, i, float(r),c)
            print("Model batch updated with all ratings from the database.")

            # # Lưu mô hình sau khi cập nhật
            self.model.save_model('mf_model.pkl')
        except ValueError as ve:
            print(f"ValueError during batch update: {ve}")
        except Exception as e:
            print(f"Error during batch update: {e}")

    def recommend(self, user_id, top_k=10):
        self.model = IncrementalMF()
        self.model.load_model('mf_model.pkl')
        try:
            if self.model is None:
                raise ValueError("Model has not been trained yet.")
            
            user_index = self.db["user_index"].find_one({"user_id": user_id})
            if user_index is None:
                raise ValueError(f"User {user_id} not found in user index.")
            user_index = user_index["user_index"]
            
            rated_items = self.db["user_rating"].find({"user_id": user_id}, {"book_id": 1})
            # join voi item_index de lay item_index
            rated_items = list(self.db["item_index"].find({"book_id": {"$in": [item["book_id"] for item in rated_items]}}, {"book_id": 1, "item_index": 1}))

            rated_items = [item["item_index"] for item in rated_items]


            recommendations = self.model.recommend(user_index, top_k=top_k, rated_items=rated_items)
            print(f"Recommendations for user {user_id}: {recommendations}") 
            # Chuyển đổi chỉ số item sang book_id
            item_index_map = {item["item_index"]: str(item["book_id"]) for item in self.db["item_index"].find()}
            recommendations = [item_index_map.get(item, None) for item in recommendations if item in item_index_map]
            if not recommendations:
                raise ValueError("No recommendations found for the user.")
            recommendations = [ book_id for book_id in recommendations]

            return recommendations
        except Exception as e:
            print(f"Error during recommendation: {e}")


if __name__ == "__main__":
    # Ví dụ sử dụng
    db_uri = "mongodb://dungta:dungta1234@64.23.233.24:27017/bookstore?authSource=admin"
    db_name = "bookstore"
    recommend_system = RecommendSystem(db_uri, db_name)
    
    # Huấn luyện mô hình
    # recommend_system.fit(n_factors=20, lr=0.01, reg=0.01, n_epochs=10)
    # recommend_system.batch_update()



    print("Model loaded successfully.")
    print(recommend_system.recommend("6832b16038e2ba2c481228ae", top_k=10))  