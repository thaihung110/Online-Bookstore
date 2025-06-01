import numpy as np
import pickle
from pymongo import MongoClient

class IncrementalMF:
    def __init__(self, n_users=None, n_items=None, n_factors=20, lr=0.01, reg=0.01):
        if n_users is not None or n_items is not None:
            self.n_users = n_users
            self.n_items = n_items
            self.n_factors = n_factors
            self.lr = lr
            self.reg = reg
            # Khởi tạo latent factors ngẫu nhiên
            self.P = np.random.normal(0, 0.1, (n_users, n_factors))  # user latent
            self.Q = np.random.normal(0, 0.1, (n_items, n_factors))  # item latent
            self.bu = np.zeros(n_users)  # user bias
            self.bi = np.zeros(n_items)  # item bias
            self.mu = 0  # global mean
            self.last_update_time = None  # Thời gian cập nhật cuối cùng
    # def __init__(self,path=None):
    #     self.load_model(path)  # Tải mô hình đã lưu nếu có

    def add_user(self):
        self.n_users += 1
    def add_item(self):
        self.n_items += 1

    def fit(self, ratings, n_epochs=10, last_update_time=None):
        # ratings: array [user_id, item_id, rating]
        self.mu = np.mean(ratings[:, 2])
        for epoch in range(n_epochs):
            np.random.shuffle(ratings)
            for u, i, r in ratings:
                self.sgd(int(u), int(i), r)
        self.last_update_time = last_update_time  # Cập nhật thời gian cuối cùng

    def sgd(self, u, i, r):
        # Dự đoán
        pred = self.mu + self.bu[u] + self.bi[i] + np.dot(self.P[u], self.Q[i])
        err = r - pred
        # Cập nhật tham số
        self.bu[u] += self.lr * (err - self.reg * self.bu[u])
        self.bi[i] += self.lr * (err - self.reg * self.bi[i])
        self.P[u] += self.lr * (err * self.Q[i] - self.reg * self.P[u])
        self.Q[i] += self.lr * (err * self.P[u] - self.reg * self.Q[i])

    def update(self, u, i, r, last_update_time=None):
        # Cập nhật mô hình với rating mới (không cần train lại toàn bộ)
        self.sgd(u, i, r)
        if last_update_time > self.last_update_time:
            self.last_update_time = last_update_time

    def predict(self, u, i):
        return self.mu + self.bu[u] + self.bi[i] + np.dot(self.P[u], self.Q[i])

    def recommend(self, u, top_k=10, rated_items=None):
        # rated_items: list các item user đã đánh giá
        scores = [self.predict(u, i) for i in range(self.n_items)]
        if rated_items is not None:
            rated_set = set(int(i) for i in rated_items)
        else:
            rated_set = set()
        # Lấy danh sách các item chưa rate
        candidates = [i for i in range(self.n_items) if i not in rated_set]
        print(f"n_users: {self.n_users}, n_items: {self.n_items}")
        # print(f"Candidates for user {u}: {candidates}")
        candidate_scores = [scores[i] for i in candidates]
        # Lấy top_k item có điểm cao nhất
        if len(candidate_scores) == 0:
            return []
        top_indices = np.argsort(candidate_scores)[-top_k:][::-1]
        top_items = [candidates[i] for i in top_indices]
        return top_items
    
    def save_model(self, path='mf_model.pkl'):
        with open(path, 'wb') as f:
            pickle.dump({
                'P': self.P,
                'Q': self.Q,
                'bu': self.bu,
                'bi': self.bi,
                'mu': self.mu,
                'n_users': self.n_users,
                'n_items': self.n_items,
                'n_factors': self.n_factors,
                'lr': self.lr,
                'reg': self.reg,
                'last_update_time': self.last_update_time
            }, f)

    def load_model(self, path='mf_model.pkl'):
        with open(path, 'rb') as f:
            params = pickle.load(f)
            self.P = params['P']
            self.Q = params['Q']
            self.bu = params['bu']
            self.bi = params['bi']
            self.mu = params['mu']
            self.n_users = params['n_users']
            self.n_items = params['n_items']
            self.n_factors = params['n_factors']
            self.lr = params['lr']
            self.reg = params['reg']
            self.last_update_time = params['last_update_time']





if __name__ == "__main__":
    # # Kết nối MongoDB
    # client = MongoClient("mongodb://dungta:dungta1234@64.23.233.24:27017/bookstore?authSource=admin")
    # db = client["bookstore"]
    # ratings_col = db["ratings"]  # Giả sử bạn có collection 'ratings' với các trường: user_id, item_id, rating

    # # Đọc dữ liệu rating từ MongoDB
    # ratings_cursor = ratings_col.find({}, {"user_id": 1, "item_id": 1, "rating": 1})
    # ratings = []
    # user_map = {}
    # item_map = {}
    # user_idx = 0
    # item_idx = 0
    # for doc in ratings_cursor:
    #     u = doc["user_id"]
    #     i = doc["item_id"]
    #     r = doc["rating"]
    #     # Map user_id và item_id sang chỉ số liên tục
    #     if u not in user_map:
    #         user_map[u] = user_idx
    #         user_idx += 1
    #     if i not in item_map:
    #         item_map[i] = item_idx
    #         item_idx += 1
    #     ratings.append([user_map[u], item_map[i], r])
    # ratings = np.array(ratings)

    # n_users = len(user_map)
    # n_items = len(item_map)
    # model = IncrementalMF(n_users=n_users, n_items=n_items)

    # # Nếu đã có model lưu, load lại, nếu chưa thì fit mới
    # import os
    # if os.path.exists('mf_model.pkl'):
    #     model.load_model('mf_model.pkl')
    # else:
    #     model.fit(ratings, n_epochs=100)
    #     model.save_model('mf_model.pkl')

    # # Khi có rating mới:
    # # Giả sử rating mới là (user_id, item_id, rating)
    # new_rating = {"user_id": "userX", "item_id": "itemY", "rating": 5}
    # # Cập nhật mapping nếu có user/item mới
    # if new_rating["user_id"] not in user_map:
    #     user_map[new_rating["user_id"]] = len(user_map)
    #     model.n_users += 1
    #     model.P = np.vstack([model.P, np.random.normal(0, 0.1, (1, model.n_factors))])
    #     model.bu = np.append(model.bu, 0)
    # if new_rating["item_id"] not in item_map:
    #     item_map[new_rating["item_id"]] = len(item_map)
    #     model.n_items += 1
    #     model.Q = np.vstack([model.Q, np.random.normal(0, 0.1, (1, model.n_factors))])
    #     model.bi = np.append(model.bi, 0)
    # u_idx = user_map[new_rating["user_id"]]
    # i_idx = item_map[new_rating["item_id"]]
    # model.update(u_idx, i_idx, new_rating["rating"])
    # model.save_model('mf_model.pkl')

    # # Ví dụ recommend cho user
    # user_id = "userX"
    # u_idx = user_map[user_id]
    # # Lấy các item user đã rate
    # rated_items = [item_map[doc["item_id"]] for doc in ratings_col.find({"user_id": user_id})]
    # print(f"Gợi ý cho user {user_id}:", model.recommend(u_idx, top_k=5, rated_items=rated_items))

    # # Ví dụ sử dụng
    # ratings = np.array([
    #     [0 ,0 ,5],
    #     [0 ,1 ,4],
    #     [0 ,3 ,2],
    #     [0 ,4 ,2],
    #     [1 ,0 ,5],
    #     [1 ,2 ,4],
    #     [1 ,3 ,2],
    #     [1 ,4 ,0],
    #     [2 ,0 ,2],
    #     [2 ,2 ,1],
    #     [2 ,3 ,3],
    #     [2 ,4 ,4],
    #     [3 ,0 ,0],
    #     [3 ,1 ,0],
    #     [3 ,3 ,4],
    #     [4 ,0 ,1],
    #     [4 ,3 ,4],
    #     [5 ,1 ,2],
    #     [5 ,2 ,1],
    #     [6 ,2 ,1],
    #     [6 ,3 ,4],
    #     [6 ,4 ,5],])
    model = IncrementalMF("mf_model.pkl")  # Load mô hình đã huấn luyện
    # model.fit(ratings, n_epochs=300)
    # Giả sử bạn đã huấn luyện mô hình và lưu nó
    user = 0
    item = 2
    # rated_item = ratings[ratings[:, 0] == user, 1]
    # print(rated_item)
    print(f"Dự đoán cho user {user} và item {item}:", model.predict(user, item))
    # print(f"Gợi ý cho user {user}:", model.recommend(user, rated_items=rated_item))

