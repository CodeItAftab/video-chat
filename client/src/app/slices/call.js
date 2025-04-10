import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  callUser: null,
  isOnCall: false,
  isCalling: false,
  isReceivingCall: false,
  isCallRejected: false,
  isCallAccepted: false,
  isCallEnded: false,
};

export const slice = createSlice({
  name: "call",
  initialState,
  reducers: {
    setCallUser: (state, action) => {
      state.callUser = action.payload;
    },
    setIsOnCall: (state, action) => {
      state.isOnCall = action.payload;
    },
    setIsCalling: (state, action) => {
      state.isCalling = action.payload;
    },
    setIsReceivingCall: (state, action) => {
      state.isReceivingCall = action.payload;
    },
    setIsCallRejected: (state, action) => {
      state.isCallRejected = action.payload;
    },
    setIsCallAccepted: (state, action) => {
      state.isCallAccepted = action.payload;
    },
    setIsCallEnded: (state, action) => {
      state.isCallEnded = action.payload;
    },
  },
});

export const {
  setCallUser,
  setIsOnCall,
  setIsCalling,
  setIsReceivingCall,
  setIsCallRejected,
  setIsCallAccepted,
  setIsCallEnded,
} = slice.actions;

export default slice.reducer;
