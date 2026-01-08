import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ element: Component, flag, ...rest }) => {
  const navigate = useNavigate();
  const goBackHandler = () => {
    navigate("/main");
  };
  console.log("rest: ", rest);
  console.log("flag: ", flag);

  // hint: you can swp out the Navigate redirect for the Component
  // <Component />

  return (
    <div>
      {flag ? (
        <Navigate to={rest.path} replace />
      ) : (
        <div>
          <p>Unauthorized!</p> <button onClick={goBackHandler}>Go Back.</button>
        </div>
      )}
    </div>
  );
};

export default ProtectedRoute;
