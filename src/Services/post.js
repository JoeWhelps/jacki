import Parse from 'parse';
import { sanitizeHeaderValue, ensureServerReady } from './utils';

export async function createPost(postData) {
  await ensureServerReady();
  console.debug('createPost: Parse.serverURL=', Parse && Parse.serverURL);
  
  // Extract userId if provided, and remove quizzes (they'll be created separately)
  const { userId, quizzes, ...postFields } = postData;
  
  if (Parse && Parse.serverURL) {
    try {
      const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
      const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
      const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
      
      if (server && appId) {
        // Use REST API to create post with user pointer
        const url = server.replace(/\/$/, '') + '/classes/Post';
        const headers = new Headers();
        headers.append('X-Parse-Application-Id', appId);
        if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
        headers.append('Content-Type', 'application/json');
        
        const bodyData = { ...postFields };
        // Remove excluded keys
        delete bodyData.id;
        delete bodyData.objectId;
        
        // Add user pointer if userId is provided
        if (userId) {
          bodyData.userId = { __type: 'Pointer', className: '_User', objectId: userId };
        }
        
        const body = JSON.stringify(bodyData);
        const res = await fetch(url, { method: 'POST', headers, body });
        
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(`REST createPost failed: ${res.status} ${t}`);
        }
        
        const created = await res.json();
        console.debug('createPost: REST created', created);
        return created;
      }
    } catch (restErr) {
      console.debug('createPost REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);
      
      try {
        const Post = Parse.Object.extend('Post');
        const post = new Post();
        
        // Set user pointer if userId provided
        if (userId) {
          post.set('userId', Parse.User.createWithoutData(userId));
        }
        
        // Copy other fields (excluding excluded keys and quizzes)
        const excludedKeys = new Set(['id', 'objectId', 'userId', 'quizzes', 'username']);
        Object.entries(postFields).forEach(([k, v]) => {
          if (!excludedKeys.has(k)) post.set(k, v);
        });
        
        const saved = await post.save();
        const out = saved.toJSON ? saved.toJSON() : saved;
        console.debug('createPost: saved to Parse:', out);
        return out;
      } catch (sdkErr) {
        console.error('Parse createPost SDK error:', sdkErr);
        throw sdkErr;
      }
    }
  }

  // Fallback: legacy storage isn't writable (static JSON). Return the postData
  console.warn('createPost: Parse not configured; returning provided postData without persistence.');
  return postData;
}

export async function updatePost(postId, postData) {
  console.debug('updatePost: Parse.serverURL=', Parse && Parse.serverURL);
  
  // Extract userId if provided, and remove quizzes (they'll be updated separately if needed)
  const { userId, quizzes, ...postFields } = postData;
  
  if (Parse && Parse.serverURL) {
    try {
      const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
      const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
      const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
      
      if (server && appId) {
        // Use REST API to update post
        const url = server.replace(/\/$/, '') + `/classes/Post/${postId}`;
        const headers = new Headers();
        headers.append('X-Parse-Application-Id', appId);
        if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
        headers.append('Content-Type', 'application/json');
        
        const bodyData = { ...postFields };
        // Remove excluded keys
        delete bodyData.id;
        delete bodyData.objectId;
        delete bodyData.createdAt;
        
        // Update updatedAt to current time
        bodyData.updatedAt = new Date().toISOString();
        
        const body = JSON.stringify(bodyData);
        const res = await fetch(url, { method: 'PUT', headers, body });
        
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(`REST updatePost failed: ${res.status} ${t}`);
        }
        
        const updated = await res.json();
        console.debug('updatePost: REST updated', updated);
        return updated;
      }
    } catch (restErr) {
      console.debug('updatePost REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);
      
      try {
        const Post = Parse.Object.extend('Post');
        const post = Post.createWithoutData(postId);
        
        // Copy other fields (excluding excluded keys and quizzes)
        const excludedKeys = new Set(['id', 'objectId', 'userId', 'quizzes', 'username', 'createdAt']);
        Object.entries(postFields).forEach(([k, v]) => {
          if (!excludedKeys.has(k)) post.set(k, v);
        });
        
        // Update updatedAt
        post.set('updatedAt', new Date());
        
        const saved = await post.save();
        const out = saved.toJSON ? saved.toJSON() : saved;
        console.debug('updatePost: saved to Parse:', out);
        return out;
      } catch (sdkErr) {
        console.error('Parse updatePost SDK error:', sdkErr);
        throw sdkErr;
      }
    }
  }

  // Fallback: legacy storage isn't writable
  console.warn('updatePost: Parse not configured; cannot update post.');
  throw new Error('Cannot update post: Parse not configured');
}
