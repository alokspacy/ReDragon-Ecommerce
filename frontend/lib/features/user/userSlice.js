import { createSlice } from '@reduxjs/toolkit';

const getInitialToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('redragon_token');
  }
  return null;
};

const userSlice = createSlice({
  name: 'user',
  initialState: {
    info: null,
    token: getInitialToken(),
    isAuthenticated: false,
    storeInfo: null, // holds their store data if they are a seller
  },
  reducers: {
    setUser: (state, action) => {
      const { user, token } = action.payload;
      state.info = user;
      state.token = token;
      state.isAuthenticated = !!user;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('redragon_token', token);
      }
    },
    clearUser: (state) => {
      state.info = null;
      state.token = null;
      state.isAuthenticated = false;
      state.storeInfo = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('redragon_token');
      }
    },
    setStoreInfo: (state, action) => {
      state.storeInfo = action.payload;
    }
  }
});

export const { setUser, clearUser, setStoreInfo } = userSlice.actions;
export default userSlice.reducer;
