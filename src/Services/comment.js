import Parse from 'parse';
import { sanitizeHeaderValue, ensureServerReady } from './utils';
import { getAllUsers } from './service';
import { getCurrentUser } from '../Components/Auth/AuthService';

// Function to create comments
export async function createComment({ postId, userId, text }) {
  await ensureServerReady();
  // 
  try {
    const recent = await getCommentsForPost(postId);
    const now = Date.now();
    const duplicate = (recent || []).find((c) => {
      try {
        const created = new Date(c.createdAt).getTime(); // created at
        const cUserId = c.user?.objectId;
        return cUserId === userId && c.text === text && (now - created) < 60_000; // 1 minute
      } catch { return false; }
    });
    if (duplicate) {
      console.debug('createComment: duplicate detected, returning existing comment', duplicate);
      return duplicate;
    }
  } catch (e) {
    // catch error
  }

  // try to put the different fields to the database- sanitized headers
  try {
    const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
    const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
    const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
    if (!server || !appId) throw new Error('parse not configured');
    const url = server.replace(/\/$/, '') + '/classes/Comment';
    const headers = new Headers();
    headers.append('X-Parse-Application-Id', appId);
    if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
    headers.append('Content-Type', 'application/json');
    const bodyData = { 
      text, 
      postId: { __type: 'Pointer', className: 'Post', objectId: postId }
    };
    
    // Add user pointer if userId is provided
    console.log("HIII ", userId);
    if (!userId) {
      userId = await getCurrentUser();
      userId = userId ? userId.id : null;
      if (!userId) {
        alert("You must be logged in to comment.");
        return;
      }
        
    }
    if (userId) {
      bodyData.userId = { __type: 'Pointer', className: '_User', objectId: userId };
    }
    
    const body = JSON.stringify(bodyData);
    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`REST createComment failed: ${res.status} ${t}`);
    }
    const created = await res.json();
    console.debug('createComment: REST created', created); // temporty check- will remove in the future
    return created;
  } catch (restErr) {
    console.debug('createComment REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);

    // Legacy Structure- will get rid of soon
    if (Parse && Parse.serverURL) {
      try {
        const Comment = Parse.Object.extend('Comment');
        const c = new Comment();
        if (postId) c.set('postId', Parse.Object.extend('Post').createWithoutData(postId));
        if (userId) c.set('userId', Parse.User.createWithoutData(userId));
        if (text) c.set('text', text);
        const saved = await c.save();
        return saved.toJSON ? saved.toJSON() : saved;
      } catch (sdkErr) {
        console.error('Parse createComment SDK fallback error:', sdkErr);
      }
    }
    // fallback to legacy local structure if available
    return { postId, userId, text };
  }
}
export async function getCommentsForPost(postId) {
  await ensureServerReady();
  // Connect the comment to the post using the pointer
  try {
    const [comments, users] = await Promise.all([
      (async () => {
        try {
          const q = new Parse.Query('Comment');
          q.equalTo('postId', Parse.Object.extend('Post').createWithoutData(postId));
          //q.include('userId');
          q.ascending('createdAt');
          const results = await q.find();
          return results.map(r => r.toJSON());
        } catch (err) {
          console.error('Error fetching comments:', err);
          return [];
        }
      })(),
      getAllUsers()
    ]);
    console.log('getCommentsForPost: fetched users', users);
    console.log('getCommentsForPost: fetched comments', comments);

    const populatedComments = comments.map(comment => {
      const userId = comment.userId ? comment.userId.objectId : null;
      const user = users.find(u => u.user.objectId === userId);
      return {
        ...comment,
        user: user
      };
    });

    console.debug('getCommentsForPost: REST results', populatedComments);
    return populatedComments;
  } catch (restErr) {
    console.debug('getCommentsForPost REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);
    if (Parse && Parse.serverURL) {
      try {
        const Comment = Parse.Object.extend('Comment');
        const q = new Parse.Query(Comment);
        q.equalTo('postId', Parse.Object.extend('Post').createWithoutData(postId));
        q.include('userId'); // Include userId pointer to fetch user data
        q.ascending('createdAt');
        const results = await q.find();
        return results.map(r => {
          const json = r.toJSON ? r.toJSON() : r;
          // Ensure userId data is included if it's a Parse object
          if (r.get && r.get('userId')) {
            const userIdObj = r.get('userId');
            if (userIdObj && typeof userIdObj.toJSON === 'function') {
              json.userId = userIdObj.toJSON();
            }
          }
          return json;
        });
      } catch (sdkErr) {
        console.error('Parse getCommentsForPost SDK fallback error:', sdkErr);
      }
    }
    return [];
  }
}

const commentService = { createComment, getCommentsForPost };
export default commentService;
