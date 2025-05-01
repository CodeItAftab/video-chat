import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  callUser: null,
  isOnCall: false,
  isCalling: false,
  isIncommingCall: false,
  isCallRejected: false,
  isCallAccepted: false,
  isCallEnded: false,
  signalData: null,
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
    setIsIncommingCall: (state, action) => {
      state.isIncommingCall = action.payload;
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
    setSignalData: (state, action) => {
      state.signalData = action.payload;
    },
    clearCallState: (state) => {
      state.callUser = null;
      state.isOnCall = false;
      state.isCalling = false;
      state.isCallRejected = false;
      state.isCallAccepted = false;
      state.isCallEnded = false;
      state.signalData = null;
      state.isIncommingCall = false;
    },
  },
});

export const {
  setCallUser,
  setIsOnCall,
  setIsCalling,
  setIsIncommingCall,
  setIsCallRejected,
  setIsCallAccepted,
  setIsCallEnded,
  setSignalData,
  clearCallState,
} = slice.actions;

export default slice.reducer;
