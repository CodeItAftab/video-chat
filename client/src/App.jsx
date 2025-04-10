import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
const SafetyLayout = lazy(() => import("@/layouts/SafetyLayout"));
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));
const MainLayout = lazy(() => import("@/layouts/MainLayout"));
const Login = lazy(() => import("@/pages/Login"));
const Home = lazy(() => import("@/pages/Home"));
const Call = lazy(() => import("@/pages/Call"));

function App() {
  return (
    <div className="h-screen w-screen">
      <Routes>
        <Route
          index
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <SafetyLayout />
            </Suspense>
          }
        />
        <Route
          path="/auth"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AuthLayout />
            </Suspense>
          }
        >
          <Route
            path="login"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Login />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <MainLayout />
            </Suspense>
          }
        >
          <Route
            index
            path="home"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="call"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Call />
              </Suspense>
            }
          />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
