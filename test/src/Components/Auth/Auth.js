import React from "react";
import { Link } from "react-router-dom";
import Parse from "parse";

const AuthModule = () => {
  Parse.User.logOut();
  return (
    <div>
      <Link to="/register">
        <button>Register</button>
      </Link>
      <br />
      <br />
      <Link to="/login">
        <button>Login</button>
      </Link>
    </div>
  );
};

export default AuthModule;
