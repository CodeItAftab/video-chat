import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { logoutUser } from "@/lib/axios"; // Adjust the import path as necessary
import { clearUsers } from "./user";
import toast from "react-hot-toast";

const initialState = {
  user: null,
  isLoggedIn: false,
};

export const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = slice.actions;

export default slice.reducer;

// Async Thunks

export const Logout = createAsyncThunk(
  "auth/logout",
  async (userId, { dispatch }) => {
    try {
      const response = await logoutUser();
      const { success } = response.data;
      if (success) {
        console.log("Logout successful");
        dispatch(logout());
        dispatch(clearUsers());
        toast.success("Logout successful");
      } else {
        console.error("Logout failed:", response.data.message);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }
);
