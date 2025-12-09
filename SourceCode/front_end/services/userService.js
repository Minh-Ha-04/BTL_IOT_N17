import axios from "axios";

const ENDPOINT = "http://172.20.10.2:5000";

export const getUsers = (token) => {
  return axios.get(`${ENDPOINT}/api/auth/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createUserAPI = (token, newAccount) => {
  return axios.post(`${ENDPOINT}/api/auth/register`, newAccount, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteUserAPI = (token, userId) => {
  return axios.delete(`${ENDPOINT}/api/auth/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
