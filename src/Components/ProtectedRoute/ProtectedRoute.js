import React from "react";
import { Navigate } from "react-router-dom";
import { checkUser } from "../Auth/AuthService";

// protected route
// simple wrapper that returns children when the user is authenticated
// otherwise navigate to the auth landing page
const ProtectedRoute = ({ children }) => {
  try {
    if (checkUser()) return children;
  } catch (err) {
    console.error("protectedroute: check failed", err);
  }

  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
