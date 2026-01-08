/**
 * LearnService (legacy)
 * ---------------------
 * This module provides a simple axios-based interface to the local `public/data/database.json`
 * used during early development and offline testing.
 *
 * Migration notes (what to remove when moving fully to Parse):
 * - Remove this file once `getAllUsers`, `getAllPosts`, `createUser` functionality is fully
 *   replaced by the Parse-backed implementations in `src/Services/service.js`, `post.js`, and `comment.js`.
 * - Steps to remove:
 *   1) Ensure `src/Services/service.js` provides all methods and handles both REST and SDK paths.
 *   2) Replace any imports of `LearnService` with the central service (search for "LearnService").
 *   3) Remove `public/data/database.json` and any axios-based fallbacks.
 *
 * Keep the module for now as a fallback and for local testing.
 */
import axios from "axios";

const url = "../data/database.json";

// this function isn't used, will be used in the future
export const createUser = (id, firstName, lastName, email, password) => {
  return axios({
    method: "post",
    url: `${url}/users`,
    data: {
      id,
      firstName,
      lastName,
      email,
      password,
    },
    headers: {
      "Content-Type": "application/json",
    },
    json: true,
  })
    .then((response) => {
      console.log("POST response: ", response);
    })
    .catch((err) => {
      console.log("POST error: ", err);
    });
};

// this function gets all the users from the database
export const getAllUsers = () => {
  return axios
    .get(url)
    .then((response) => {
      console.log("Raw response:", response.data);
      const usersObj = response.data.users || {};
      return Object.values(usersObj);
    })
    .catch((err) => {
      console.log("GET Error: ", err);
      return [];
    });
};

// this function gets all the posts from the database
export const getAllPosts = () => {
  return axios
    .get(url)
    .then((response) => {
      console.log("Raw response (posts):", response.data);
      const postsObj = response.data.posts || {};
      return Object.values(postsObj);
    })
    .catch((err) => {
      console.log("GET posts error: ", err);
      return [];
    });
};

/* End of LearnService
 * When fully migrated to Parse, delete this file and run a global search to replace any remaining
 * `LearnService.getAllUsers` / `LearnService.getAllPosts` usages.
 */
