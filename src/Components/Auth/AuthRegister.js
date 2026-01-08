import React, { useEffect, useState } from "react";
import { checkUser, createUser } from "./AuthService";
import AuthForm from "./AuthForm";
import { useNavigate } from "react-router-dom";

// registration page
// collects user info and attempts to create a parse user
const AuthRegister = () => {
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (checkUser()) {
      // already signed in, go to main app
      navigate("/");
    }
  }, [navigate]);

  const onChangeHandler = (e) => {
    const { name, value: newValue } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: newValue }));
    setError(null);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCreated = await createUser(newUser);
      if (userCreated) {
        console.debug("authregister: registration successful");
        navigate("/");
      }
    } catch (err) {
      // show inline error and reset sensitive fields
      console.error("authregister: register failed", err);
      setError(err.message || "registration failed");
      setNewUser((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <div className="auth-container">
      {error && <div className="auth-error">{error}</div>}
      <AuthForm user={newUser} onChange={onChangeHandler} onSubmit={onSubmitHandler} />
    </div>
  );
};

export default AuthRegister;
