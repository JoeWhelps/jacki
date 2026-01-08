import React from "react";
import "./DeepenPanel.css";

/**
 * Deepen Panel - Level 2 Content Overlay
 * Shows the topic summary and further reading link from a post
 */
export default function DeepenPanel({ post, onClose }) {
  if (!post) return null;

  const hasContent = post.topicSummary || post.furtherReadingLink;

  if (!hasContent) {
    return (
      <div className="deepen-overlay" onClick={onClose}>
        <div className="deepen-panel" onClick={(e) => e.stopPropagation()}>
          <div className="deepen-header">
            <h2>Deepen Your Learning</h2>
            <button className="deepen-close" onClick={onClose}>×</button>
          </div>
          <div className="deepen-content">
            <p className="deepen-empty">No additional content available for this post.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deepen-overlay" onClick={onClose}>
      <div className="deepen-panel" onClick={(e) => e.stopPropagation()}>
        <div className="deepen-header">
          <h2>Deepen Your Learning</h2>
          <button className="deepen-close" onClick={onClose}>×</button>
        </div>
        
        <div className="deepen-content">
          {/* AI Summary Section */}
          {post.topicSummary && (
            <section className="deepen-section">
              <h3>Summary</h3>
              <div className="deepen-summary">
                {post.topicSummary}
              </div>
            </section>
          )}

          {/* Further Reading Link Section */}
          {post.furtherReadingLink && (
            <section className="deepen-section">
              <h3>Further Reading</h3>
              <div className="deepen-link-container">
                <a 
                  href={post.furtherReadingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="deepen-link"
                >
                  {post.furtherReadingLink}
                </a>
                <span className="deepen-link-hint">Opens in new tab</span>
              </div>
            </section>
          )}
        </div>

        <div className="deepen-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Back to Post
          </button>
        </div>
      </div>
    </div>
  );
}

