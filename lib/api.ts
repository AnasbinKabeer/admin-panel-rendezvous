import axios from "axios";

export const api = axios.create({
    // baseURL: "https://slateblue-wasp-644886.hostingersite.com/api",
    baseURL: "http://localhost:5000/api",

    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});