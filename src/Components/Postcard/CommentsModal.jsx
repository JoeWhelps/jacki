import React, { useState, useEffect } from "react";
import { getCommentsForPost, createComment } from "../../Services/comment";
import { getCurrentUser } from "../../Components/Auth/AuthService";
import { formatDate } from "../../utils/dateFormatter";
import "./CommentsModal.css";

export default function CommentsModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (post.objectId) {
      setLoadingComments(true);
      getCommentsForPost(post.objectId)
        .then(data => {
          setComments(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('Error loading comments:', err);
          setComments([]);
        })
        .finally(() => {
          setLoadingComments(false);
        });
    }
  }, [post.objectId]);

  // saves a comment when user submits
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    
    const currentUser = await getCurrentUser();
    console.debug('Current user for commenting:', currentUser);
    const userId = currentUser && currentUser.id ? currentUser.id : null;
    
    setSubmittingComment(true);
    try {
      await createComment({ postId: post.objectId, userId, text: commentText.trim() });
      setCommentText('');
      // reloads the comments list
      const data = await getCommentsForPost(post.objectId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comments-modal-header">
          <h3>Comments</h3>
          <button className="comments-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="comments-modal-content">
          {loadingComments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">No comments yet.</div>
          ) : (
            comments.map((c) => {
              // gets username the same way posts do
              const commentUserName = c.user?.username || 'Anonymous';
              
              return (
                <div className="comments-modal-item" key={c.objectId || c.createdAt || JSON.stringify(c)}>
                  <div className="comments-modal-left">
                    <span className="comments-modal-username">{commentUserName}:</span>
                    <span className="comments-modal-text">{c.text}</span>
                  </div>
                  <div className="comments-modal-date">{formatDate(c.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>
        <form className="comments-modal-form" onSubmit={handleCommentSubmit}>
          <input
            className="comments-modal-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submittingComment}
          />
          <button 
            className="comments-modal-submit" 
            type="submit" 
            disabled={submittingComment || !commentText.trim()}
          >
            {submittingComment ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

