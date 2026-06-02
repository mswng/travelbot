import axios from "axios";

const axiosClient = axios.create({

    baseURL: "http://localhost:8080/travelbot/api",

    headers: {
        "Content-Type": "application/json",
    },
});

/* TOKEN */

axiosClient.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {

        config.headers.Authorization =
            `Bearer ${token}`;
    }

    return config;
});

export default axiosClient;