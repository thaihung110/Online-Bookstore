import axios from "axios";

const recommendApi = axios.create({
  baseURL: process.env.REACT_APP_RECOMMEND_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: process.env.REACT_APP_API_TIMEOUT
    ? parseInt(process.env.REACT_APP_API_TIMEOUT as string)
    : 10000,
  withCredentials: true,
});

export default recommendApi;
