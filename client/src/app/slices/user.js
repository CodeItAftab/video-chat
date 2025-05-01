import { getAllUsers } from "@/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  activeUsers: [],
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
    setActiveusers: (state, action) => {
      state.activeUsers = action.payload;
    },
    pushActiveUser: (state, action) => {
      const user = state.activeUsers.find(
        (user) => user._id === action.payload._id
      );
      if (!user) {
        state.activeUsers.push(action.payload);
      }
    },
    removeActiveUser: (state, action) => {
      state.activeUsers = state.activeUsers.filter(
        (user) => user._id !== action.payload._id
      );
    },
    clearUsers: (state) => {
      state.users = [];
      state.activeUsers = [];
    },
  },
});

export const {
  addUser,
  removeUser,
  setUsers,
  setActiveusers,
  clearUsers,
  pushActiveUser,
  removeActiveUser,
} = slice.actions;

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
