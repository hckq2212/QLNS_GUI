import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: localStorage.getItem('accessToken') || null, 
  user: JSON.parse(localStorage.getItem('user') || 'null'), 
  role: localStorage.getItem('role') ? JSON.parse(localStorage.getItem('role')) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user, role } = action.payload;
      state.accessToken = accessToken;
      state.user = user;
      if (role !== undefined) state.role = role;
      // lưu vào localStorage để khi reload vẫn còn
      localStorage.setItem('accessToken', accessToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      if (role !== undefined && role !== null) localStorage.setItem('role', JSON.stringify(role));
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.role = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    },
    restoreSession: (state) => {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      const role = localStorage.getItem('role');
      if (token) state.accessToken = token;
      if (user) state.user = JSON.parse(user);
      if (role) state.role = JSON.parse(role);
    },
    setRole: (state, action) => {
      state.role = action.payload;
      if (action.payload !== undefined && action.payload !== null) localStorage.setItem('role', JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, logout, restoreSession, setRole } = authSlice.actions;
export default authSlice.reducer;
