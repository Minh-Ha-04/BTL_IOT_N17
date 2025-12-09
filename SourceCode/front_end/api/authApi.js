import axios from "axios";

const ENDPOINT = "http://172.20.10.2:5000";

export const loginApi = async (username, password) => {
  return axios.post(`${ENDPOINT}/api/auth/login`, { username, password });
};
