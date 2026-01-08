import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { checkUser } from "./AuthService";
import "./auth.css";

// auth landing
// simple page that links to register or login. keeps the auth
// experience separated from the main app chrome (no sidebar)

const AuthModule = () => {
  const navigate = useNavigate();

  // redirect already authenticated users back to home
  useEffect(() => {
    if (checkUser()) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="auth-landing">
      <h1 className="auth-title">jacki</h1>
      <p className="auth-quote">
        A jack of all trades is master of none...
        <br />
        but oftentimes better than the master of one
      </p>
      <div className="auth-buttons">
        <Link to="/auth/register" className="auth-button">
          register
        </Link>
        <Link to="/auth/login" className="auth-button">
          login
        </Link>
      </div>
    </div>
  );
};

export default AuthModule;
