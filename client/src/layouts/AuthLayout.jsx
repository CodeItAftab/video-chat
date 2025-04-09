import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

function AuthLayout() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }

    if (!isLoggedIn) {
      navigate("/auth/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}

export default AuthLayout;
// This layout is responsible for handling authentication-related routes
// and redirects the user to the home page if they are already logged in.
