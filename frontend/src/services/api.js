import axios from 'axios';

const api = axios.create({
  baseURL: 'https://hospital-management-system-sxp5.onrender.com/api',
  withCredentials: true,
});

export default api;