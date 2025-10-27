import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, refreshToken } = action.payload;
            state.user = user;
            state.token = token;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;