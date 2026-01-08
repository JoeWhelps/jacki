import Components from "./Components/Components";
import { useState, useEffect } from "react";
import { getAllUsers, getAllPosts } from "./Services/service";
import Parse from "parse";

// Initialize Parse from environment variables.
const Env = require("./environments");
Parse.initialize(Env.APPLICATION_ID, Env.JAVASCRIPT_KEY);
Parse.serverURL = Env.SERVER_URL;

function App() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", collapsed);
    } catch {}
  }, [collapsed]);

  // Define the users and posts from the service
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getAllUsers().then((usersArray) => {
      setUsers(usersArray);
    });
    getAllPosts().then((postsArray) => {
      console.debug('App: fetched posts count=', postsArray && postsArray.length);
      console.debug('App: sample posts=', (postsArray || []).slice(0,3));
      setPosts(postsArray);
    });
  }, []);

  // toggle sidebar
  const handleToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((v) => !v); // overlay on small screens
    } else {
      setCollapsed((c) => !c); // shrink/expand on desktop
    }
  };

  // clicking main closes overlay on mobile
  const handleMainClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };
  
  return <Components elements={{ collapsed, onToggle: handleToggle, mobileOpen, users, posts, handleMainClick, setMobileOpen, setCollapsed, setUsers, setPosts}} />;
}

export default App;
