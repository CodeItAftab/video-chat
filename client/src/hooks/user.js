import { UserContext } from "@/context/UserContext";
import { useContext } from "react";

const useUser = () => {
  const user = useContext(UserContext);
  return user;
};

export { useUser };
