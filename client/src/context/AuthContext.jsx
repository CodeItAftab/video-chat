import { googleAuth, logout } from "@/lib/axios";
import { useGoogleLogin } from "@react-oauth/google";
import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedIsLoggedIn = localStorage.getItem("isLoggedIn");
    return savedIsLoggedIn ? JSON.parse(savedIsLoggedIn) : false;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  const responseGoogle = async (authResult) => {
    try {
      setLoading(true);
      if (authResult["code"]) {
        console.log(authResult.code);
        const result = await googleAuth(authResult.code);
        const { user } = result.data;
        setUser(user);
        setIsLoggedIn(true);
        toast.success("Successfully logged in", {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        console.log(authResult);
        throw new Error(authResult);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
    redirectUri: "http://localhost:5173/", // Replace with your app's redirect URI
  });

  const Logout = async () => {
    try {
      await logout();
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      toast.success("Successfully logged out", {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        loading,
        setLoading,
        googleLogin,
        Logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
