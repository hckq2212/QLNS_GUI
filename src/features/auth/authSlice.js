import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: localStorage.getItem('accessToken') || null, 
  user: JSON.parse(localStorage.getItem('user') || 'null'), 
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.accessToken = accessToken;
      state.user = user;
      // lưu vào localStorage để khi reload vẫn còn
      localStorage.setItem('accessToken', accessToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    restoreSession: (state) => {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      if (token) state.accessToken = token;
      if (user) state.user = JSON.parse(user);
    },
  },
});

export const { setCredentials, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
