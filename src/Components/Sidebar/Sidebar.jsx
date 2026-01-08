import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { logoutUser, getCurrentUser } from "../Auth/AuthService";
import "./Sidebar.css";

// Helper to normalize a Parse.Object or plain JS user into a simple object
function normalizeUser(u) {
  if (!u) return null;
  // If Parse Object with toJSON
  if (typeof u.toJSON === "function") {
    try {
      const data = u.toJSON();
      // ensure createdAt is available
      if (!data.createdAt && u.get && u.get("createdAt")) data.createdAt = u.get("createdAt");
      return data;
    } catch (e) {
      console.debug("normalizeUser: toJSON failed", e);
    }
  }

  // If object has attributes (Parse legacy)
  if (u.attributes) {
    const out = { ...u.attributes };
    if (u.id) out.objectId = u.id;
    return out;
  }

  // If it's a Parse.User instance with get()
  if (u.get && typeof u.get === "function") {
    const keys = ["username", "firstName", "lastName", "email", "bio", "location", "website"];
    const out = {};
    keys.forEach((k) => {
      try {
        const v = u.get(k);
        if (v !== undefined) out[k] = v;
      } catch (e) {}
    });
    out.objectId = u.id;
    out.createdAt = u.createdAt || (u.get && u.get("createdAt"));
    return out;
  }

  // Fallback: assume plain object
  return { ...u };
}

// sidebar navigation
// shows main links and a sign out button when the user is signed in

const Sidebar = ({ collapsed: collapsedProp, onToggle, isMobileOpen }) => {
  // fallback to local state if parent doesn't control collapse
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = typeof collapsedProp === "boolean" ? collapsedProp : localCollapsed;
  const setCollapsed = typeof collapsedProp === "boolean" ? (v) => {} : setLocalCollapsed;
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(normalizeUser(user));
    };
    fetchUser();
  }, []);

  // use parse sdk current user to build profile link
  const profileName = currentUser?.username || currentUser?.firstName || null;


  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Toggle button to collapse the sidebar*/}
      <button
        className="toggle-btn"
        onClick={() => {
          if (onToggle) {
            onToggle();
          } else {
            setCollapsed(!collapsed);
          }
        }}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      {/* Sidebar nav only shows when not collapsed */}
      {!collapsed && (
        <nav className="sidebar-nav" role="navigation" aria-label="Main">
          <div className="sidebar-top">
            <h1>jacki </h1>
            <ul>
              <li>
                <Link to="/">Main</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/create">Create</Link>
              </li>
              <li>
                <Link to="/messaging">Messaging</Link>
              </li>
              {/*
              future pages
              <li>
                <a href="/posts">Posts</a>
              </li>
              <li>
                <a href="/settings">Settings</a>
              </li>
              */}
            </ul>
          </div>
          <div className="sidebar-bottom">
            <Link to={profileName ? `/profile/${profileName}` : "/profile"} className="sidebar-profile-link">Profile</Link>
            <button
              className="sidebar-logout"
              onClick={async () => {
                console.debug("Sidebar: sign out clicked");
                const ok = await logoutUser();
                if (ok) {
                  // Reload the page to ensure all state is cleared
                  window.location.reload();
                } else {
                  alert("Sign out failed");
                }
              }}
            >
              Sign Out
            </button>
          </div>
        </nav>
      )}
    </aside>
  );
};

export default Sidebar;