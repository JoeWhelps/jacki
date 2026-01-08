import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAllUsers, getAllPosts } from "../../Services/service";
import { getCurrentUser } from "../Auth/AuthService";
import Parse from "parse";
import Postcard from "../Postcard/Postcard";

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


// future ideas: show user icon images, skills gained, favorite categories, likes, etc.
export default function Profile({ users, posts: allPosts = [] }) {
  const { username } = useParams(); // only username in URL; may be undefined for "my profile"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
    // profile view
    // shows a user's profile. if no username param is provided
    // then the current logged-in user is shown. this component
    // prefers direct parse queries against the _User class, and
    // falls back to legacy service calls only when needed.

  // Helper: find user by username/objectId/user_id
  useEffect(() => {
      console.debug("profile: loading profile for username param=", username);
    const findInArray = (usersArray = []) => {
      return usersArray.find((u) => {
        if (!u) return false;
        // match username, objectId, or legacy user_id
        if (u.username && u.username === username) return true;
        if (u.objectId && String(u.objectId) === String(username)) return true;
        if (u.user_id && String(u.user_id) === String(username)) return true;
        return false;
      });
    };

    let aborted = false;

    const tryFind = async () => {
      setLoading(true);
      // If no username provided, try to use current logged-in user
      if (!username) {
        try {
          const cur = await getCurrentUser();
            console.debug("profile: getCurrentUser returned", !!cur);
          if (cur) {
            if (!aborted) setUser(normalizeUser(cur));
            setLoading(false);
            return;
          }
        } catch (err) {
            console.error("profile: error getting current user", err);
        }
      }

      // Try provided users prop first
      console.debug("Profile: users prop length=", (users || []).length);
      let found = findInArray(users || []);
      console.debug("Profile: local lookup result=", found);
      if (found) {
        if (!aborted) setUser(normalizeUser(found));
        setLoading(false);
        return;
      }

      // If not found locally, attempt to load user via Parse.User query (preferred for _User)
      try {
        console.debug("Profile: querying Parse.User for username/objectId...", username);
        if (username) {
          const q = new Parse.Query(Parse.User);
          // attempt to match by username or objectId
          // Try username first
          q.equalTo("username", username);
          let foundObj = await q.first();
          if (!foundObj) {
            // try by objectId
            const q2 = new Parse.Query(Parse.User);
            try {
              foundObj = await q2.get(username);
            } catch (e) {
              // could not fetch by id
              console.debug("Profile: Parse.User.get failed for id", username, e.message || e);
            }
          }

          if (foundObj) {
            console.debug("Profile: Parse.User query returned", foundObj);
            if (!aborted) setUser(normalizeUser(foundObj));
            if (!aborted) setLoading(false);
            return;
          }
        }

        // Fallback: use service.getAllUsers() (legacy/local JSON or REST classes)
        console.debug("Profile: fallback fetching all users from service...");
        const all = await getAllUsers();
        console.debug("Profile: service returned users count=", (all || []).length);
        const f = findInArray(all || []);
        console.debug("Profile: remote lookup result=", f);
        if (!aborted) setUser(f ? normalizeUser(f) : null);
      } catch (err) {
          console.error("profile: error fetching users from service or parse", err);
        if (!aborted) setUser(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    tryFind();
    return () => {
      aborted = true;
    };
  }, [username, users]);

  // Load user's posts
  useEffect(() => {
    if (!user || !user.objectId) return;
    
    const loadUserPosts = async () => {
      setLoadingPosts(true);
      try {
        // Use provided posts or fetch all
        const postsToFilter = allPosts.length > 0 ? allPosts : await getAllPosts();
        // Filter posts by userId
        const filtered = postsToFilter.filter(p => {
          const postUserId = p.userId?.objectId || p.userId || p.username;
          const userIdToMatch = user.objectId || user.id;
          return postUserId === userIdToMatch || String(postUserId) === String(userIdToMatch);
        });
        setUserPosts(filtered);
      } catch (err) {
        console.error('Error loading user posts:', err);
        setUserPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadUserPosts();
  }, [user, allPosts]);

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>User not found.</p>;

  // Render a friendly profile view showing available fields
  const displayFields = [
    "firstName",
    "lastName",
    "username",
    "email",
    "bio",
    "location",
    "website",
    "Joined At"
  ];
  
  user["Joined At"] = user.createdAt;


  const avatarUrl = user.avatar || user.profileImage || user.photo || user.picture || null;

  // Helper to safely render any key/value pairs that exist on the user object
  

  return (
    <div className="profile-root">
      <header className="profile-header">
        {avatarUrl ? (
          // image may be a Parse File object or direct URL
          <img
            src={typeof avatarUrl === "string" ? avatarUrl : avatarUrl.url || ""}
            alt={`${user.username || (user.firstName && `${user.firstName} ${user.lastName}`) || "user"} avatar`}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              background: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <strong>{(user.username || user.firstName || "?").charAt(0).toUpperCase()}</strong>
          </div>
        )}

        <div style={{ marginLeft: 16 }}>
          <h1>{(user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.username || user.user_id)}</h1>
          <p style={{ margin: 0, color: "#666" }}>@{user.username || user.user_id}</p>
          {user.email && <p style={{ marginTop: 8 }}>Email: {user.email}</p>}
          {user.bio && <p style={{ marginTop: 8 }}>{user.bio}</p>}
        </div>
      </header>

      <section className="profile-details" style={{ marginTop: 24 }}>
        <h2>Profile fields</h2>
        <table>
          <tbody>
            {displayFields.map((k) =>
              user[k] ? (
                <tr key={k}>
                  <td style={{ padding: 8, fontWeight: "bold", verticalAlign: "top" }}>{k}</td>
                  <td style={{ padding: 8 }}>{String(user[k])}</td>
                </tr>
              ) : null
            )}

            
          </tbody>
        </table>
      </section>

      <section className="profile-posts" style={{ marginTop: 24 }}>
        <h2>Posts</h2>
        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : userPosts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <div className="profile-posts-list">
            {userPosts.map((p) => (
              <Postcard key={p.objectId || p.id} post={p} users={users} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}