import React, { useState, useEffect } from "react";
import { updatePost } from "../../Services/post";
import { getCurrentUser } from "../../Components/Auth/AuthService";
import { searchTopic } from "../../Services/huggingface";
import { getQuizzesForPost } from "../../Services/quiz";
import "../CreatePost/CreatePost.css";
import "./EditPostModal.css";

// EditPostModal: Similar to CreatePost but pre-filled with existing post data
export default function EditPostModal({ post, onClose, onPostUpdated }) {
  // Level 1: Basic post fields
  const [caption, setCaption] = useState(post.caption || "");
  const [file, setFile] = useState(null);
  const [existingImageData] = useState(post.imageData || "");
  const [allowComments, setAllowComments] = useState(post.allowComments !== false);
  
  // Level 2: Topic summary
  const [topicSearch, setTopicSearch] = useState("");
  const [aiResponse, setAiResponse] = useState({ summary: "", link: "" });
  const [topicSummary, setTopicSummary] = useState(post.topicSummary || "");
  const [furtherReadingLink, setFurtherReadingLink] = useState(post.furtherReadingLink || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Level 3: Quizzes (we'll load existing ones)
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load existing quizzes for this post
    if (post.objectId) {
      setLoadingQuizzes(true);
      getQuizzesForPost(post.objectId)
        .then(data => {
          const validQuizzes = (data || []).filter(
            q => q.question && q.options && q.options.length >= 2
          );
          // Convert to edit format
          const editQuizzes = validQuizzes.map((q, idx) => ({
            id: q.objectId || `quiz_${idx}`,
            question: q.question || "",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
          }));
          setQuizzes(editQuizzes);
        })
        .catch(err => {
          console.error('Error loading quizzes:', err);
        })
        .finally(() => {
          setLoadingQuizzes(false);
        });
    }
  }, [post.objectId]);

  const handleTopicSearch = async (e) => {
    e.preventDefault();
    if (!topicSearch.trim()) {
      setSearchError("Please enter a topic to search");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    
    try {
      const response = await searchTopic(topicSearch.trim());
      setAiResponse(response);
    } catch (error) {
      console.error("Error searching topic:", error);
      setSearchError(error.message || "Failed to search topic. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSummary = () => {
    if (aiResponse.summary) {
      setTopicSummary(aiResponse.summary.substring(0, 2500));
    }
  };

  const handleAddLink = () => {
    if (aiResponse.link) {
      setFurtherReadingLink(aiResponse.link);
    }
  };

  const handleSummaryChange = (e) => {
    const value = e.target.value;
    if (value.length <= 2500) {
      setTopicSummary(value);
    }
  };

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let mediaData = existingImageData;
      let mediaType = post.mediaType || (post.hasImage ? "image" : null);
      
      if (file) {
        mediaData = await toBase64(file);
        if (file.type.startsWith("video/")) {
          mediaType = "video";
        } else if (file.type.startsWith("image/")) {
          mediaType = "image";
        }
      }

      const currentUser = await getCurrentUser();
      const userId = currentUser && currentUser.id ? currentUser.id : null;
      
      if (!userId) {
        alert("You must be logged in to edit a post");
        return;
      }

      // Prepare updated post data
      const updatedPost = {
        caption: caption.trim(),
        hasImage: mediaType === "image" && !!mediaData,
        hasVideo: mediaType === "video" && !!mediaData,
        imageData: mediaType === "image" ? mediaData : (post.imageData || ""),
        videoData: mediaType === "video" ? mediaData : (post.videoData || ""),
        mediaType,
        allowComments,
        topicSummary: topicSummary.trim(),
        furtherReadingLink: furtherReadingLink.trim(),
      };

      // Update post
      const updated = await updatePost(post.objectId, updatedPost);
      console.debug('EditPost: updated response:', updated);
      
      // Note: Quizzes are not updated here - they remain as separate entities
      // If needed, we could add quiz update/delete functionality later

      if (onPostUpdated) {
        onPostUpdated(updated);
      }
      
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
      alert("Failed to update post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-post-overlay" onClick={onClose}>
      <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-post-header">
          <h1>Edit Post</h1>
          <button className="edit-post-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Level 1: Basic Post */}
          <section className="post-section">
            <h2>Post Content</h2>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="form-input"
              placeholder="Write a caption..."
              rows={4}
            />
            <div className="file-upload">
              <label htmlFor="media-upload" className="file-label">
                {existingImageData ? "Change Video or Image (jpg or png only)" : "Upload Video or Image (jpg or png only)"}
              </label>
              {existingImageData && (
                <div className="existing-image-preview">
                  <img src={existingImageData?.startsWith('data:') ? existingImageData : `data:image/png;base64,${existingImageData}`} alt="Current" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                </div>
              )}
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
              {file && (
                <div className="file-info">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
              Allow comments
            </label>
          </section>

          {/* Level 2: Topic Summary */}
          <section className="post-section">
            <h2>Topic Summary (Level 2)</h2>
            
            <div className="topic-search">
              <div className="search-form">
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="form-input"
                  placeholder="Search a topic (e.g., 'Quantum Physics', 'Ancient Rome')"
                  disabled={isSearching}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching && topicSearch.trim()) {
                      handleTopicSearch(e);
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={handleTopicSearch}
                  className="btn btn-primary"
                  disabled={isSearching || !topicSearch.trim()}
                >
                  {isSearching ? "Searching..." : "Search Topic"}
                </button>
              </div>
              {searchError && <div className="error-message">{searchError}</div>}
              
              {(aiResponse.summary || aiResponse.link) && (
                <div className="ai-response-display">
                  <label className="form-label">AI Response (for reference only)</label>
                  
                  {aiResponse.summary && (
                    <div className="ai-response-item">
                      <div className="ai-response-header">
                        <span className="ai-response-label">Summary:</span>
                        <button 
                          type="button"
                          onClick={handleAddSummary}
                          className="btn btn-add-small"
                        >
                          Add
                        </button>
                      </div>
                      <div className="ai-response-text">{aiResponse.summary}</div>
                    </div>
                  )}
                  
                  {aiResponse.link && (
                    <div className="ai-response-item">
                      <div className="ai-response-header">
                        <span className="ai-response-label">Link:</span>
                        <button 
                          type="button"
                          onClick={handleAddLink}
                          className="btn btn-add-small"
                        >
                          Add
                        </button>
                      </div>
                      <div className="ai-response-link">
                        <a href={aiResponse.link} target="_blank" rel="noopener noreferrer">
                          {aiResponse.link}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="summary-editor">
              <label htmlFor="topic-summary" className="form-label">
                Your Summary (max 2500 characters) *
              </label>
              <textarea
                id="topic-summary"
                value={topicSummary}
                onChange={handleSummaryChange}
                className="form-input summary-textarea"
                placeholder="Write your own summary..."
                rows={4}
                maxLength={2500}
              />
              <div className="char-count">
                {topicSummary.length}/2500 characters
              </div>
            </div>

            <div className="further-reading">
              <label htmlFor="further-reading-link" className="form-label">
                Further Reading Link (optional)
              </label>
              <input
                id="further-reading-link"
                type="url"
                value={furtherReadingLink}
                onChange={(e) => setFurtherReadingLink(e.target.value)}
                className="form-input"
                placeholder="https://example.com/article"
              />
            </div>
          </section>

          {/* Level 3: Quizzes - Show existing but note they can't be edited here */}
          <section className="post-section">
            <h2>Quizzes (Level 3)</h2>
            {loadingQuizzes ? (
              <p>Loading quizzes...</p>
            ) : quizzes.length > 0 ? (
              <p className="helper-text">This post has {quizzes.length} quiz(es). Quizzes cannot be edited here.</p>
            ) : (
              <p className="helper-text">No quizzes for this post.</p>
            )}
          </section>

          <div className="form-actions">
            <button type="submit" className="btn btn-submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-cancel"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

