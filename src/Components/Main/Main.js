import React, { useState, useEffect } from "react";
import MainList from "./MainList";
import { Autocomplete, TextField } from "@mui/material";
import "./main.css";

const Main = ({ posts }) => {
  const [searchTerm, setSearchTerm] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    if (posts) {
      setFilteredPosts(posts);
    }
  }, [posts]);

  useEffect(() => {
    const allSearchTerms = [...searchTerm, ...inputValue.split(' ').filter(Boolean)].map(term => term.toLowerCase());

    if (allSearchTerms.length > 0) {
      const newFilteredPosts = posts.filter(post => {
        const topicSummary = post.topicSummary?.toLowerCase() || "";
        const caption = post.caption?.toLowerCase() || "";
        const author = post.user?.username?.toLowerCase() || "";

        return allSearchTerms.some(term => 
          topicSummary.includes(term) || 
          caption.includes(term) || 
          author.includes(term)
        );
      });
      setFilteredPosts(newFilteredPosts);
    } else {
      setFilteredPosts(posts);
    }
  }, [searchTerm, inputValue, posts]);

  return (
    <div className="main-container">
      <h1>jacki</h1>
      <Autocomplete
        className="search-bar"
        multiple
        freeSolo
        options={[]}
        value={searchTerm}
        onChange={(event, newValue) => {
          setSearchTerm(newValue);
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Search posts by topic, caption, or author"
            placeholder="Search..."
          />
        )}
      />
      {/* Feed */}
      <MainList posts={filteredPosts} />
    </div>
  );
};

export default Main;
