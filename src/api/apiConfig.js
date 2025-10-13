import axios from 'axios';


const API_URL = 'http://192.168.130.239:3000'; // Replace with your actual local IP address



const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// If an access token is already stored (from a previous login), set the Authorization header
try {
  const token = localStorage.getItem('accessToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
} catch (e) {
  // ignore (e.g., during server-side rendering or environments without localStorage)
}


export default api;