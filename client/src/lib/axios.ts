import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 429) {
      console.warn("Rate limited. Redirecting to rate limit page.");

      window.location.href = "/rate-limit";

      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);
