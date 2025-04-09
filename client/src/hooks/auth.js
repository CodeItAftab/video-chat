import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const auth = useContext(AuthContext);
  return auth;
};
