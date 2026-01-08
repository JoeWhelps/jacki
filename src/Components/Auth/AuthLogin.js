import React, { useEffect, useState } from "react";
import { checkUser, loginUser } from "./AuthService";
import AuthForm from "./AuthForm";
import { useNavigate } from "react-router-dom";

// login page
// handles submitting credentials and showing inline errors

const AuthLogin = () => {
  const navigate = useNavigate();

  // redirect already authenticated users back to home
  const [currentUser, setCurrentUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (checkUser()) {
      // already authenticated -> go to main app
      navigate("/");
    }
  }, [navigate]);

  const onChangeHandler = (e) => {
    const { name, value: newValue } = e.target;
    setCurrentUser((prev) => ({ ...prev, [name]: newValue }));
    setError(null);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userLoggedIn = await loginUser(currentUser);
      if (userLoggedIn) {
        console.debug("authlogin: login successful - navigating to /");
        navigate("/");
      }
    } catch (err) {
      // show a friendly inline message and clear the password
      console.error("authlogin: login failed", err);
      setError(err.message || "login failed");
      setCurrentUser((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <div className="auth-container">
      {error && <div className="auth-error">{error}</div>}
      <AuthForm user={currentUser} isLogin={true} onChange={onChangeHandler} onSubmit={onSubmitHandler} />
    </div>
  );
};

export default AuthLogin;
