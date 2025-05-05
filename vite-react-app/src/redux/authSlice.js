import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,       // Datos del usuario (nombre, email...)
  firebaseToken: null, // ID token de Firebase
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.firebaseToken = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.firebaseToken = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
