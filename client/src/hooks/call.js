import { useContext } from "react";
import { CallContext } from "../context/CallContext";

const useCall = () => {
  const call = useContext(CallContext);
  if (!call) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return call;
};

export { useCall };
