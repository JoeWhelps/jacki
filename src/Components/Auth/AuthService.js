import Parse from "parse";
import Cookies from "js-cookie";

// auth service
// helpers for signing up, logging in, checking and logging out users
// these wrap the parse sdk and provide small logging hooks for debugging

// used in auth register component
export const createUser = (newUser) => {
  const user = new Parse.User();

  user.set("username", newUser.email);
  user.set("firstName", newUser.firstName);
  user.set("lastName", newUser.lastName);
  user.set("password", newUser.password);
  user.set("email", newUser.email);
  user.set("jackiScore", "0"); // Initialize score to 0

  console.debug("User: ", user);
  return user
    .signUp()
    .then((newUserSaved) => {
      // create a new Profile object
      const Profile = Parse.Object.extend("Profile");
      const profile = new Profile();
      profile.set("user", newUserSaved);
      profile.set("firstName", newUserSaved.get("firstName"));
      profile.set("lastName", newUserSaved.get("lastName"));
      profile.set("username", newUserSaved.get("username"));
      // save the Profile object
      profile.save().then(() => {
        console.debug("createUser: Profile object saved successfully");
      }).catch((error) => {
        console.error("createUser: error saving Profile object", error);
      });
      console.debug("createUser: signUp successful", newUserSaved);
      return newUserSaved;
    })
    .catch((error) => {
      console.error("createUser: signUp error", error);
      alert(`Error: ${error.message}`);
      throw error;
    });
};

// used in auth login component
export const loginUser = (currUser) => {
  // Use the Parse SDK static method to log in a user by username and password.
  if (!currUser || !currUser.email || !currUser.password) {
    return Promise.reject(new Error("Missing credentials"));
  }

  console.debug("loginUser: attempting login for", currUser.email);
  return Parse.User.logIn(currUser.email, currUser.password)
    .then((currUserSaved) => {
      console.debug("loginUser: login successful", currUserSaved);
      return currUserSaved;
    })
    .catch((error) => {
      console.error("loginUser: login error", error);
      alert(`Error: ${error.message}`);
      throw error;
    });
};

export const checkUser = () => {
  // Parse.User.current() returns the current user object or null.
  // Convert to boolean to indicate authentication state.
  try {
    return !!Parse.User.current();
  } catch (err) {
    console.error("checkUser error:", err);
    return false;
  }
};

export const logoutUser = async () => {
  try {
    await Parse.User.logOut();
    // after logging out, remove all cookies
    const allCookies = Cookies.get();
    for (let cookie in allCookies) {
      Cookies.remove(cookie);
    }
    console.debug("logoutUser: logged out successfully and cleared cookies");
    return true;
  } catch (err) {
    console.error("logoutUser error:", err);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const u = Parse.User.current();
    console.debug("getCurrentUser: found user", u);
    return u;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
};
