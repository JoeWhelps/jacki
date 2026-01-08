import React, { useState, useEffect } from "react";
import Main from "./Main/Main.js";
import Sidebar from "./Sidebar/Sidebar.jsx";
import Profile from "./Profile/Profile.jsx";
import AuthModule from "./Auth/Auth.js";
import AuthRegister from "./Auth/AuthRegister";
import AuthLogin from "./Auth/AuthLogin";
import CreatePost from "./CreatePost/CreatePost.jsx";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import Messages from "./Messages/Messages.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";
import FloatingScore from "./Score/FloatingScore.jsx";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { checkUser, getCurrentUser } from "./Auth/AuthService";

// components: top-level routing and layout
// this file chooses between the auth-only layout (no sidebar)
// and the main app layout. auth routes are isolated so the
// login/register experience is clean and focused.


// this file is just to hold the main components structure and pass down props
const Components = ({ elements }) => {
  // destructure elements object
  // only pull the props we actually use here
  const { collapsed, onToggle, mobileOpen, users, posts, handleMainClick, setPosts } = elements;
  console.debug("components: rendered main layout", { collapsed, mobileOpen });

  // detect if we're on an auth route so we can render a standalone auth layout
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith("/auth");

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (checkUser()) {
      getCurrentUser().then((user) => {
        console.log("Fetched user:", user);
        setCurrentUser(user);
      });
    }
  }, []);

  // Root redirect: unauthenticated users should go to /auth (not /auth/login)
  const rootElement = checkUser() ? (
    <Main users={users} posts={posts} />
  ) : (
    <Navigate to="/auth" replace />
  );

  if (isAuthRoute) {
    // Render auth pages without sidebar or app chrome
    return (
      <div className="auth-page">
        <Routes>
          <Route path="/auth" element={<AuthModule />} />
          <Route path="/auth/register" element={<AuthRegister />} />
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/" element={rootElement} />
        </Routes>
      </div>
    );
  }

  // Normal app layout with sidebar
  return (
    <div
      className={`app-container ${collapsed ? "collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={onToggle}
        isMobileOpen={mobileOpen}
      />
      {checkUser() && <FloatingScore />}
      <div className="main" onClick={handleMainClick}>
        <Routes>
          <Route path="/" element={rootElement} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePost users={users} onCreate={(newPost) => setPosts((prev) => [newPost, ...(prev || [])])} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messaging"
            element={
              <ProtectedRoute>
                <Messages users={users} currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <Profile users={users} posts={posts} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};


export default Components;
