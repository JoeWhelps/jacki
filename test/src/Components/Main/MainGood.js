import React from "react";
import { Link, useParams } from "react-router-dom";

const MainGood = () => {
  // const { firstName, lastName } = useParams();

  return (
    <div>
      {<h1>User logged in!</h1>}
      <button>
        <Link to="/main">Go back.</Link>
      </button>
    </div>
  );
};

export default MainGood;
