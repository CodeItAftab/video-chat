import { FetchAllUsers } from "@/app/slices/user";
import SocketProvider from "@/Provider/SocketProvider";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

function MainLayout() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // if (!isLoggedIn) {
  //   navigate("/auth/login", { replace: true });
  // }

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth/login", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    document.title = "Video Chat App";
    dispatch(FetchAllUsers());
  }, [dispatch]);

  return (
    <SocketProvider>
      <div className="h-full w-full ">
        <Outlet />
      </div>
    </SocketProvider>
  );
}

export default MainLayout;
// This layout is responsible for handling authentication-related routes
// and redirects the user to the home page if they are already logged in.
