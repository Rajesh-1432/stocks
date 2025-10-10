import React, { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Lazy load components
const Layout = lazy(() => import("./Layout/Layout"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Users = lazy(() => import("./pages/Users"));

const Loading = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-gray-600">{text}</span>
    </div>
  </div>
);

const AuthenticatedApp = ({ onLogout }) => {
  
  return (
    <Suspense fallback={<Loading text="Loading application..." />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const UnauthenticatedApp = ({ onLoginSuccess }) => {
  return (
    <Suspense fallback={<Loading text="Loading login..." />}>
      <Routes>
        <Route path="/login" element={<Index onLoginSuccess={onLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    
    const checkAuthentication = () => {
      try {
        const token = localStorage.getItem("authToken");

        if (token) {
          try {
            const decoded = jwtDecode(token);
            setUserInfo(decoded);
            localStorage.setItem("userInfo", JSON.stringify(decoded));
            setIsAuthenticated(true);
            if (location.pathname === "/login") {
              navigate("/", { replace: true });
            }
          } catch (decodeError) {
            console.error("❌ Invalid token, logging out...", decodeError);
            handleLogout();
          }
        } else {
          setIsAuthenticated(false);
          if (location.pathname !== "/login") {
            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("❌ Authentication check failed:", error);
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuthentication();
  }, [location.pathname, navigate]);

  const handleLoginSuccess = (token) => {
    localStorage.setItem("authToken", token);
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("userInfo", JSON.stringify(decoded));
      setUserInfo(decoded);
    } catch (error) {
      console.error("❌ Error decoding token", error);
    }

    setIsAuthenticated(true);
    navigate("/", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    setUserInfo(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  if (isLoading || !authChecked) {
    return <Loading text="Checking authentication..." />;
  }

  return (
    <>
      {isAuthenticated ? (
        <AuthenticatedApp onLogout={handleLogout} />
      ) : (
        <UnauthenticatedApp onLoginSuccess={handleLoginSuccess} />
      )}
      <Toaster />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;