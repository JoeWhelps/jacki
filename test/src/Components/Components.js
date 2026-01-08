import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthModule from "./Auth/Auth.js";
import AuthRegister from "./Auth/AuthRegister.js";
import AuthLogin from "./Auth/AuthLogin.js";
import Main from "./Main/Main.js";
import MainGood from "./Main/MainGood.js";
import ProtectedRoute from "../Common/ProtectedRoute.js";

const Components = () => {
  return (
    <Router>
      <Routes>
        <Route path="/loggedin" element={<Main />} />
        <Route path="/success" element={<MainGood />} />
        <Route path="/auth" element={<AuthModule />} />
        <Route path="/register" element={<AuthRegister />} />
        <Route path="/login" element={<AuthLogin />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
};

export default Components;
