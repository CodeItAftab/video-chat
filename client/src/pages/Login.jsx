import { Button } from "@/components/ui/button";
import googleIcon from "@/assets/googleIcon.svg";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { googleAuth } from "@/lib/axios";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { login } from "@/app/slices/auth";
// import { useAuth } from "@/hooks/auth";

function Login() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const responseGoogle = async (authResult) => {
    try {
      setLoading(true);
      if (authResult["code"]) {
        console.log(authResult.code);
        const result = await googleAuth(authResult.code);
        const { user, success } = result.data;
        if (success) {
          dispatch(login({ user, isLoggedIn: true }));
          console.log(user);
          toast.success("Successfully logged in", {
            style: {
              background: "#333",
              color: "#fff",
            },
          });
        }
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
    redirectUri: "https://video-chat-gamma-sand.vercel.app/", // Replace with your app's redirect URI
    // redirectUri: "http://localhost:5173/", // Replace with your app's redirect URI
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Button
        variant="outline"
        className={"cursor-pointer active:scale-95"}
        onClick={googleLogin}
      >
        <img className="h-4" src={googleIcon} alt="googleIcon" />
        {loading ? "loading..." : "Continue with Google"}
      </Button>
    </div>
  );
}

export default Login;
