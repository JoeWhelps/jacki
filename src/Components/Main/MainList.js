import React from "react";
import Postcard from "../Postcard/Postcard";

// Main feed: render posts in a centered feed like Instagram/TikTok
const MainList = ({ posts = [] }) => {
  return (
    <div className="feed">
      {(!posts || posts.length === 0) && <p className="feed-empty">No posts available.</p>}
      {posts && posts.length > 0 && (
        posts.map((p) => (
          <Postcard key={p.objectId || p.id || Math.random()} post={p} />
        ))
      )}
    </div>
  );
};

export default MainList;
