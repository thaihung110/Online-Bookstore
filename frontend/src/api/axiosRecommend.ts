import axios from "axios";

const recommendApi = axios.create({
  baseURL: process.env.REACT_APP_RECOMMEND_API_URL || "http://127.0.0.1:8081",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: process.env.REACT_APP_API_TIMEOUT
    ? parseInt(process.env.REACT_APP_API_TIMEOUT as string)
    : 10000,
});

export default recommendApi;
