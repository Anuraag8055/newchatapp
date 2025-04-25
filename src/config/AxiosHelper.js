import axios from "axios";
export const baseURL = "http://10.244.2.232:8080";
export const httpClient = axios.create({
  baseURL: baseURL,
});
