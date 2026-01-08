import React, { useEffect, useState, useCallback } from 'react';
import { createComment, getCommentsForPost } from '../../Services/comment';
import './comment.css';

export default function CommentSection({ post, currentUser }) {
	const [comments, setComments] = useState([]);
	const [text, setText] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getCommentsForPost(post.objectId);
			setComments(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error('load comments error', err);
			setComments([]);
		} finally {
			setLoading(false);
		}
	}, [post.objectId]);

	useEffect(() => {
		if (!post.objectId) return;
		load();
	}, [post.objectId, load]);

	// saves a comment when user submits
	const onSubmit = async (e) => {
		e.preventDefault();
		if (submitting) return;
		if (!text || !text.trim()) return;
		
		const userId = currentUser && currentUser.id ? currentUser.id : null;
		
		setSubmitting(true);
		const payload = { postId: post.objectId, userId, text: text.trim() };
		try {
			console.debug('CommentSection.onSubmit payload=', payload);
			const saved = await createComment(payload);
			console.debug('CommentSection.onSubmit saved=', saved);
			// reloads comments from server
			await load();
			setText('');
		} catch (err) {
			console.error('create comment error', err);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="comment-section">
			<div className="comments-list">
				{loading && <div className="comment-loading">Loading comments...</div>}
				{!loading && comments.length === 0 && <div className="comment-empty">No comments yet.</div>}
				{comments.map((c) => {
					const userName = c.user?.username || 'Anonymous';
					
					return (
						<div className="comment-item" key={c.objectId || c.createdAt || JSON.stringify(c)}>
							<div className="comment-author">{userName}</div>
							<div className="comment-text">{c.text}</div>
							<div className="comment-meta">{new Date(c.createdAt || Date.now()).toLocaleString()}</div>
						</div>
					);
				})}
			</div>

			<form className="comment-form" onSubmit={onSubmit}>
						<input
							className="comment-input"
							placeholder="Add a comment..."
							value={text}
							onChange={(e) => setText(e.target.value)}
							disabled={submitting}
						/>
						<button className="comment-submit" type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post'}</button>
			</form>
		</div>
	);
}
