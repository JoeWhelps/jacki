import Parse from 'parse';
import { sanitizeHeaderValue } from './utils';

/**
 * Create a quiz associated with a post and user
 * @param {Object} quizData - Quiz data with postId, userId, question, options, correctAnswer, difficulty
 * @returns {Promise<Object>} - Created quiz object
 */
export async function createQuiz({ postId, userId, question, options, correctAnswer, difficulty }) {
  if (!postId) {
    throw new Error('postId is required to create a quiz');
  }
  if (!userId) {
    throw new Error('userId is required to create a quiz');
  }
  if (!question || !question.trim()) {
    throw new Error('question is required');
  }
  if (!options || !Array.isArray(options) || options.length < 2) {
    throw new Error('options must be an array with at least 2 items');
  }
  if (correctAnswer === null || correctAnswer === undefined) {
    throw new Error('correctAnswer is required');
  }
  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('difficulty must be one of: easy, medium, hard');
  }

  try {
    const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
    const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
    const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
    if (!server || !appId) throw new Error('parse not configured');
    
    const url = server.replace(/\/$/, '') + '/classes/Quiz';
    const headers = new Headers();
    headers.append('X-Parse-Application-Id', appId);
    if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
    headers.append('Content-Type', 'application/json');
    
    const body = JSON.stringify({
      question: question.trim(),
      options: options.filter(opt => opt && opt.trim() !== ''),
      correctAnswer,
      difficulty,
      postId: { __type: 'Pointer', className: 'Post', objectId: postId },
      userId: { __type: 'Pointer', className: '_User', objectId: userId }
    });
    
    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`REST createQuiz failed: ${res.status} ${t}`);
    }
    const created = await res.json();
    console.debug('createQuiz: REST created', created);
    return created;
  } catch (restErr) {
    console.debug('createQuiz REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);

    if (Parse && Parse.serverURL) {
      try {
        const Quiz = Parse.Object.extend('Quiz');
        const quiz = new Quiz();
        quiz.set('postId', Parse.Object.extend('Post').createWithoutData(postId));
        quiz.set('userId', Parse.User.createWithoutData(userId));
        quiz.set('question', question.trim());
        quiz.set('options', options.filter(opt => opt && opt.trim() !== ''));
        quiz.set('correctAnswer', correctAnswer);
        quiz.set('difficulty', difficulty);
        const saved = await quiz.save();
        return saved.toJSON ? saved.toJSON() : saved;
      } catch (sdkErr) {
        console.error('Parse createQuiz SDK fallback error:', sdkErr);
        throw sdkErr;
      }
    }
    throw restErr;
  }
}

/**
 * Get all quizzes for a specific post
 * @param {string} postId - The post objectId
 * @returns {Promise<Array>} - Array of quiz objects
 */
export async function getQuizzesForPost(postId) {
  if (!postId) {
    return [];
  }

  try {
    const server = sanitizeHeaderValue(Parse.serverURL || process.env.REACT_APP_PARSE_SERVER_URL || process.env.PARSE_SERVER_URL);
    const appId = sanitizeHeaderValue(Parse.applicationId || process.env.REACT_APP_PARSE_APP_ID || process.env.PARSE_APP_ID);
    const jsKey = sanitizeHeaderValue(Parse.javascriptKey || process.env.REACT_APP_PARSE_JS_KEY || process.env.PARSE_JS_KEY);
    if (!server || !appId) throw new Error('parse not configured');
    
    const url = server.replace(/\/$/, '') + `/classes/Quiz?where=${encodeURIComponent(JSON.stringify({ postId: { __type: 'Pointer', className: 'Post', objectId: postId } }))}&order=createdAt`;
    const headers = new Headers();
    headers.append('X-Parse-Application-Id', appId);
    if (jsKey) headers.append('X-Parse-Javascript-Key', jsKey);
    headers.append('Content-Type', 'application/json');
    
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`REST getQuizzesForPost failed: ${res.status} ${t}`);
    }
    const body = await res.json();
    const results = Array.isArray(body.results) ? body.results : [];
    console.debug('getQuizzesForPost: REST results', results);
    return results.map(r => ({ ...r }));
  } catch (restErr) {
    console.debug('getQuizzesForPost REST failed, trying SDK fallback:', restErr && restErr.message ? restErr.message : restErr);
    
    if (Parse && Parse.serverURL) {
      try {
        const Quiz = Parse.Object.extend('Quiz');
        const q = new Parse.Query(Quiz);
        q.equalTo('postId', Parse.Object.extend('Post').createWithoutData(postId));
        q.ascending('createdAt');
        const results = await q.find();
        return results.map(r => (r.toJSON ? r.toJSON() : r));
      } catch (sdkErr) {
        console.error('Parse getQuizzesForPost SDK fallback error:', sdkErr);
      }
    }
    return [];
  }
}

const quizService = { createQuiz, getQuizzesForPost };
export default quizService;

