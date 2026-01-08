import Parse from 'parse';
// Legacy defined but not used- will be removed soon
import * as Legacy from './LearnService';

import { createPost as createPostFromPostModule } from './post';
import { createComment, getCommentsForPost } from './comment';
import { ensureServerReady } from './utils';

// Still some references to 'Legacy' here- we will delete that later once reviewed

async function createUser(id, firstName, lastName, email, password) {
  // Use Parse - legacy available as a fallback option
  if (Parse && Parse.serverURL) {
    try {
      const User = Parse.Object.extend('User');
      const user = new User();
      user.set('id', id);
      user.set('firstName', firstName);
      user.set('lastName', lastName);
      user.set('email', email);
      user.set('password', password);
      const saved = await user.save();
      return saved.toJSON ? saved.toJSON() : saved;
    } catch (err) {
      console.error('Parse createUser error:', err);
      // fallthrough to legacy
    }
  }

  return Legacy.createUser(id, firstName, lastName, email, password);
}

async function getAllUsers() {
  // Connect to the server, and read all users
  if (Parse && Parse.serverURL) {
    try {
      const Profile = Parse.Object.extend('Profile');
      const q = new Parse.Query(Profile);
      q.include("userId");
      q.ascending('createdAt');
      const results = await q.find();
      return results.map(r => r.toJSON());
    } catch (err) {
      console.error('Parse getAllUsers error:', err);
      // fallthrough
    }
  }

  return Legacy.getAllUsers();
}
async function getAllPosts() {
  await ensureServerReady();
  if (Parse && Parse.serverURL) {
    try {
      console.debug('getAllPosts: using Parse.serverURL=', Parse.serverURL);
      // Example of retrieving the raw JSON data
      const [posts, users] = await Promise.all([
        (async () => {
          try {
            const q = new Parse.Query('Post');
            q.descending('createdAt');
            //q.include('userId');

            const results = await q.find();
            const posts = results.map(post => {
              const postJson = post.toJSON();
              
              // 🌟 Get the raw Parse object for the included user
              const userObject = post.get('userId'); 
              console.log(post)
              // Add the user data back to the JSON structure manually
              if (userObject) {
                  postJson.userId = userObject.toJSON();
              }
              
              return postJson;
          });
          console.log(posts)
            return posts;
          } catch (err) {
            console.error('Error fetching posts:', err);
            return [];
          }
        })(),
        getAllUsers()
      ]);

      const populatedPosts = posts.map(post => {
        const userId = post.userId ? post.userId.objectId : null;
        const user = users.find(u => u.user.objectId === userId);
        console.log(userId, user, post, users)
        return {
          ...post,
          user: user
        };
      });

      console.debug('getAllPosts: fetched', populatedPosts.length, 'posts from Parse. sample=', populatedPosts.slice(0,3));
      return populatedPosts;
    } catch (err) {
      console.error('Parse getAllPosts error:', err);
      // fallthrough
    }
  }

  console.debug('getAllPosts: falling back to Legacy.getAllPosts (local JSON)');
  return Legacy.getAllPosts();
}

  // thin wrapper to re-export the post creation functionality
  async function createPost(postData) {
    return createPostFromPostModule(postData);
  }

  export { createUser, getAllUsers, getAllPosts, createPost, createComment, getCommentsForPost };
  
  // Re-export quiz service
  export { createQuiz, getQuizzesForPost } from './quiz';
