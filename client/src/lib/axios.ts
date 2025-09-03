import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (res) => res, // if success, just return the response
  (error) => {
    const status = error.response?.status;

    if (status === 429) {
      console.warn("Rate limited. Redirecting to rate limit page.");
      window.location.href = "/rate-limit";

      return new Promise(() => {});
    }
    return Promise.reject(error); // other errors
  }
);
