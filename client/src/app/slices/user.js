import { getAllUsers } from "@/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
};

export const slice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    removeUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload.id);
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
    },
  },
});

export const { addUser, removeUser, setUsers, clearUsers } = slice.actions;

export default slice.reducer;
// This slice manages the user-related state in the Redux store.

// Async Thunks

export const FetchAllUsers = createAsyncThunk(
  "user/FetchAllUsers",
  async (_, { dispatch }) => {
    try {
      const response = await getAllUsers();
      const { success, users } = response.data;
      if (success) {
        dispatch(setUsers(users));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
);
