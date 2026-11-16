import { configureStore, createSlice } from '@reduxjs/toolkit';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('homeserve_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getInitialUser(),
    token: localStorage.getItem('homeserve_access_token') || null,
    isAuthenticated: Boolean(localStorage.getItem('homeserve_access_token')),
  },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.access_token;
      state.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    selectedCity: 'All Cities',
    sidebarCollapsed: false,
  },
  reducers: {
    setSelectedCity(state, action) {
      state.selectedCity = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const { setSelectedCity, toggleSidebar } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export default store;
