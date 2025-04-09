import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function SafetyLayout() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home", { replace: true });
    } else {
      navigate("/auth/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return null; // Render nothing since this component only handles redirection
}

export default SafetyLayout;
