// src/services/api.js
import axios from 'axios';

const Axios = axios.create({
  // baseURL: 'https://api.thinkit.blog/api', // use your public URL and protocol (http or https)
    baseURL: 'http://localhost:4000/api', // use your public URL and protocol (http or https)
});

// Optionally, set a request interceptor to add the token to headers
Axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Or use context
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default Axios;
