import React, { useEffect, useState } from "react";
import { getUser } from "./AuthService";
import AuthLoginForm from "./AuthLoginForm";
import { Link } from "react-router";
import { useNavigate } from "react-router-dom";

const AuthLogin = () => {
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // flag is the state to watch for add/remove updates
  const [add, setAdd] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (newUser && add) {
      getUser(newUser).then((userFetched) => {
        if (userFetched) {
          alert(`${userFetched.get("firstName")}, you successfully logged in!`);
          localStorage.loggedIn = true;
          navigate("/loggedin");
        }
        setAdd(false);
      });
    }
  }, [newUser, add]);

  const onChangeHandler = (e) => {
    e.preventDefault();
    console.log(e.target);
    const { name, value: newValue } = e.target;
    console.log(newValue);
    setNewUser({ ...newUser, [name]: newValue });
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    console.log("submitted: ", e.target);
    setAdd(true);
  };

  return (
    <div>
      <AuthLoginForm
        user={newUser}
        onChange={onChangeHandler}
        onSubmit={onSubmitHandler}
      />
      <a href="../../App.js">Go Back</a>
    </div>
  );
};

export default AuthLogin;
