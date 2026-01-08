import React, { useEffect, useState } from "react";
import Parse from "parse";
import ProtectedRoute from "../../Common/ProtectedRoute.js";
import MainGood from "./MainGood.js";

const Main = () => {
  const [flag, setFlag] = useState(false);
  const currentUser = Parse.User.current();
  var check = !!currentUser;
  console.log(check);
  useEffect(() => {
    if (check === true) {
      console.log("authorized!");
      setFlag(true);
    } else {
      console.log("unauthorized!");
      setFlag(false);
    }
  }, [check]);

  // In this case the flag is acquired through a check box, but it could also be received through another method
  // check the parse api docs for Parse.User() methods (authorized)

  return (
    <div>
      <ProtectedRoute exact path="/success" flag={flag} element={MainGood} />
      {/* <Route path="" element={}/> */}
    </div>
  );
};

export default Main;
