import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import "./postcard.css";
import { formatDate } from "../../utils/dateFormatter";
import { getQuizzesForPost } from "../../Services/quiz";
import { getCommentsForPost } from "../../Services/comment";
import { getCurrentUser } from "../../Components/Auth/AuthService";
import { createComment } from "../../Services/comment";
import { addScore, SCORE_POINTS, getCompletedQuizzes, markQuizCompleted } from "../../Services/score";
import ReportModal from "./ReportModal";
import InAppBrowser from "./InAppBrowser";
import CreateQuizModal from "./CreateQuizModal";
import CommentsModal from "./CommentsModal";
import EditPostModal from "./EditPostModal";

// Phone-native Postcard with inline Deepen/Quiz views
export default function Postcard({ post }) {
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'deepen', 'quiz'
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showInAppBrowser, setShowInAppBrowser] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reportContentType, setReportContentType] = useState('post');
  
  // Check if current user owns this post
  const currentUser = getCurrentUser();
  const currentUserId = currentUser && currentUser.id ? currentUser.id : null;
  const postUserId = post.userId?.objectId;
  const isOwner = currentUserId && postUserId === currentUserId;
  
  // Quiz state
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Check if post has Level 2 content
  const hasDeepenContent = post.topicSummary || post.furtherReadingLink;

  const userName = post.user?.username || 'Anonymous';

  // loads quizzes and hides ones already done when user clicks quiz
  useEffect(() => {
    if (viewMode === 'quiz' && post.objectId) {
      setLoadingQuizzes(true);
      // starts fresh when entering quiz mode
      setQuizzes([]);
      setCurrentQuizIndex(0);
      setSelectedAnswer(null);
      setShowQuizResult(false);
      setQuizScore(0);
      
      Promise.all([
        getQuizzesForPost(post.objectId),
        getCompletedQuizzes()
      ])
        .then(([data, completedIds]) => {
          const validQuizzes = (data || []).filter(
            q => q.question && q.options && q.options.length >= 2 && q.correctAnswer !== null && q.correctAnswer !== undefined
          );
          // hides quizzes the user already finished
          const availableQuizzes = validQuizzes.filter(
            q => !completedIds.includes(q.objectId)
          );
          if (availableQuizzes.length > 0) {
            const shuffled = [...availableQuizzes].sort(() => Math.random() - 0.5);
            setQuizzes(shuffled);
          } else if (validQuizzes.length > 0) {
            setQuizzes([]);
          }
        })
        .catch(err => {
          console.error('Error loading quizzes:', err);
        })
        .finally(() => {
          setLoadingQuizzes(false);
        });
    }
  }, [viewMode, post.objectId]);

  // Load comments
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

  const handleDeepenClick = () => {
    if (hasDeepenContent) {
      setViewMode('deepen');
    }
  };

  const handleQuizClick = () => {
    setViewMode('quiz');
  };

  const handleBackToStandard = () => {
    setViewMode('standard');
    // Reset quiz state
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowQuizResult(false);
    setQuizScore(0);
  };

  const handleAnswerSelect = (index) => {
    if (showQuizResult) return;
    setSelectedAnswer(index);
  };

  // checks if answer is right and gives points
  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !quizzes[currentQuizIndex]) return;
    setShowQuizResult(true);
    if (selectedAnswer === quizzes[currentQuizIndex].correctAnswer) {
      setQuizScore(quizScore + 1);
      
      // marks this quiz as done
      const currentQuiz = quizzes[currentQuizIndex];
      const quizId = currentQuiz.objectId;
      
      if (quizId) {
        await markQuizCompleted(quizId);
      }
      
      // gives points based on how hard it was
      const difficulty = currentQuiz.difficulty?.toLowerCase();
      const pointsMap = {
        easy: SCORE_POINTS.QUIZ_EASY,
        medium: SCORE_POINTS.QUIZ_MEDIUM,
        hard: SCORE_POINTS.QUIZ_HARD
      };
      const points = pointsMap[difficulty] || 0;
      
      if (points > 0) {
        await addScore(points, `Correct ${difficulty} quiz answer`);
        window.dispatchEvent(new Event("scoreUpdated"));
      }
    }
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedAnswer(null);
      setShowQuizResult(false);
    }
  };

  // saves a comment when user submits
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    
    const currentUser = getCurrentUser();
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

  const handleReport = (contentType) => {
    setReportContentType(contentType);
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reason) => {
    // TODO: Implement report submission to backend
    console.log(`Reporting ${reportContentType}:`, reason);
    // For now, just log it
    return Promise.resolve();
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    setShowInAppBrowser(true);
  };

  // reloads quizzes after a new one is created
  const handleQuizCreated = () => {
    if (post.objectId) {
      Promise.all([
        getQuizzesForPost(post.objectId),
        getCompletedQuizzes()
      ])
        .then(([data, completedIds]) => {
          const validQuizzes = (data || []).filter(
            q => q.question && q.options && q.options.length >= 2 && q.correctAnswer !== null && q.correctAnswer !== undefined
          );
          // hides quizzes the user already finished
          const availableQuizzes = validQuizzes.filter(
            q => !completedIds.includes(q.objectId)
          );
          if (availableQuizzes.length > 0) {
            const shuffled = [...availableQuizzes].sort(() => Math.random() - 0.5);
            setQuizzes(shuffled);
          } else {
            setQuizzes([]);
          }
        })
        .catch(err => {
          console.error('Error reloading quizzes:', err);
        });
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy": return "#28a745";
      case "medium": return "#ffc107";
      case "hard": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const currentQuiz = quizzes[currentQuizIndex];
  const isLastQuiz = currentQuizIndex === quizzes.length - 1;
  const displayedComments = comments.slice(0, 2);
  
  // Get user avatar
  const userAvatar = post.userId?.avatar || post.userId?.profileImage || post.userId?.photo || post.userId?.picture || null;
  const avatarLetter = userName.charAt(0).toUpperCase();

  const handlePostUpdated = (updatedPost) => {
    // Reload the page or update the post in parent component
    window.location.reload();
  };

  // Deepen View
  if (viewMode === 'deepen') {
    return (
      <>
        <article className="postcard postcard-deepen">
          <div className="pc-deepen-content">
            {post.topicSummary && (
              <section className="pc-deepen-section">
                <h4>Summary</h4>
                <p>{post.topicSummary}</p>
              </section>
            )}
            {post.furtherReadingLink && (
              <section className="pc-deepen-section">
                <h4>Further Reading</h4>
                <button 
                  onClick={handleLinkClick}
                  className="pc-deepen-link-btn"
                >
                  {post.furtherReadingLink}
                </button>
              </section>
            )}
          </div>
          <div className="pc-deepen-footer">
            <button className="pc-footer-btn pc-footer-back" onClick={handleBackToStandard}>
              ← Back
            </button>
            <button className="pc-footer-btn pc-footer-quiz" onClick={handleQuizClick}>
              Quiz
            </button>
            <button 
              className="pc-footer-btn pc-footer-report" 
              onClick={() => handleReport('deepen panel')}
              title="Report"
            >
              ⚠
            </button>
          </div>
        </article>
        {showInAppBrowser && (
          <InAppBrowser url={post.furtherReadingLink} onClose={() => setShowInAppBrowser(false)} />
        )}
        {showReportModal && (
          <ReportModal 
            onClose={() => setShowReportModal(false)} 
            onSubmit={handleReportSubmit}
            contentType={reportContentType}
          />
        )}
      </>
    );
  }

  // Quiz View
  if (viewMode === 'quiz') {
    if (loadingQuizzes) {
      return (
        <article className="postcard postcard-quiz">
          <div className="pc-quiz-loading">Loading quizzes...</div>
        </article>
      );
    }

    if (quizzes.length === 0) {
      return (
        <>
          <article className="postcard postcard-quiz">
            <div className="pc-quiz-empty">No quizzes available for this post.</div>
            <div className="pc-quiz-footer">
              <button className="pc-footer-btn pc-footer-back" onClick={handleBackToStandard}>
                ← Back
              </button>
              <button className="pc-footer-btn pc-footer-deepen" onClick={handleDeepenClick}>
                Deepen
              </button>
              <button className="pc-footer-btn pc-footer-create" onClick={() => setShowCreateQuizModal(true)}>
                Create Quiz
              </button>
              <button 
                className="pc-footer-btn pc-footer-report" 
                onClick={() => handleReport('quiz')}
                title="Report"
              >
                ⚠
              </button>
            </div>
          </article>
          {showCreateQuizModal && (
            <CreateQuizModal 
              post={post} 
              onClose={() => setShowCreateQuizModal(false)}
              onQuizCreated={handleQuizCreated}
            />
          )}
          {showReportModal && (
            <ReportModal 
              onClose={() => setShowReportModal(false)} 
              onSubmit={handleReportSubmit}
              contentType={reportContentType}
            />
          )}
        </>
      );
    }

    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;

    return (
      <>
        <article className="postcard postcard-quiz">
          <div className="pc-quiz-progress">Question {currentQuizIndex + 1} of {quizzes.length}</div>
          
          <div className="pc-quiz-card">
            <div 
              className="pc-quiz-difficulty"
              style={{ backgroundColor: getDifficultyColor(currentQuiz.difficulty) }}
            >
              {currentQuiz.difficulty ? currentQuiz.difficulty.charAt(0).toUpperCase() + currentQuiz.difficulty.slice(1) : "Unknown"}
            </div>
            
            <h3 className="pc-quiz-question">{currentQuiz.question}</h3>
            
            <div className="pc-quiz-options">
              {currentQuiz.options.map((option, index) => {
                let optionClass = "pc-quiz-option";
                if (showQuizResult) {
                  if (index === currentQuiz.correctAnswer) {
                    optionClass += " pc-quiz-option-correct";
                  } else if (index === selectedAnswer && index !== currentQuiz.correctAnswer) {
                    optionClass += " pc-quiz-option-incorrect";
                  }
                } else if (selectedAnswer === index) {
                  optionClass += " pc-quiz-option-selected";
                }

  return (
                  <button
                    key={index}
                    className={optionClass}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showQuizResult}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {showQuizResult && (
              <div className={`pc-quiz-feedback ${isCorrect ? 'pc-quiz-feedback-correct' : 'pc-quiz-feedback-incorrect'}`}>
                {isCorrect ? (
                  <div>
                    <strong>✓ Correct!</strong>
                    <p>Great job!</p>
                  </div>
                ) : (
                  <div>
                    <strong>✗ Incorrect</strong>
                    <p>The correct answer is: <strong>{currentQuiz.options[currentQuiz.correctAnswer]}</strong></p>
                  </div>
                )}
              </div>
            )}

            <div className="pc-quiz-actions">
              {!showQuizResult ? (
                <button
                  className="pc-btn pc-btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </button>
              ) : (
                <>
                  {!isLastQuiz ? (
                    <button className="pc-btn pc-btn-primary" onClick={handleNextQuiz}>
                      Next Question →
                    </button>
                  ) : (
                    <div className="pc-quiz-complete">
                      <h4>Quiz Complete!</h4>
                      <p>You scored {quizScore} out of {quizzes.length}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="pc-quiz-footer">
            <button className="pc-footer-btn pc-footer-back" onClick={handleBackToStandard}>
              ← Back
            </button>
            <button className="pc-footer-btn pc-footer-deepen" onClick={handleDeepenClick}>
              Deepen
            </button>
            <button className="pc-footer-btn pc-footer-create" onClick={() => setShowCreateQuizModal(true)}>
              Create Quiz
            </button>
            <button 
              className="pc-footer-btn pc-footer-report" 
              onClick={() => handleReport('quiz')}
              title="Report"
            >
              ⚠
            </button>
          </div>
        </article>
        {showCreateQuizModal && (
          <CreateQuizModal 
            post={post} 
            onClose={() => setShowCreateQuizModal(false)}
            onQuizCreated={handleQuizCreated}
          />
        )}
        {showReportModal && (
          <ReportModal 
            onClose={() => setShowReportModal(false)} 
            onSubmit={handleReportSubmit}
            contentType={reportContentType}
          />
        )}
      </>
    );
  }

  // Standard View
  return (
    <>
      <article className="postcard">
        {/* Username with avatar and edit button */}
        <div className="pc-username-top">
          {isOwner && (
            <button 
              className="pc-edit-btn"
              onClick={() => setShowEditModal(true)}
              title="Edit post"
            >
              ✏️
            </button>
          )}
          {userAvatar ? (
            <img 
              src={typeof userAvatar === "string" ? userAvatar : userAvatar.url || ""} 
              alt={userName}
              className="pc-user-avatar"
            />
          ) : (
            <div className="pc-user-avatar pc-user-avatar-placeholder">
              {avatarLetter}
            </div>
          )}
          <Link to={`/profile/${(post.userId?.username || post.userId?.objectId) || postUserId || post.username || 'anonymous'}`}>
            {userName}
          </Link>
        </div>

        {/* Image */}
      <div className="pc-media">
        {post.hasImage ? (
          <img src={post.imageData?.startsWith('data:') ? post.imageData : `data:image/png;base64,${post.imageData}`} alt={post.caption} />
        ) : (
          <div className="pc-placeholder">No media</div>
        )}
      </div>

        {/* Deepen and Quiz Buttons */}
        <div className="pc-level-buttons">
          {hasDeepenContent && (
            <button className="pc-level-btn pc-level-btn-deepen" onClick={handleDeepenClick}>
              Deepen
            </button>
          )}
          <button className="pc-level-btn pc-level-btn-quiz" onClick={handleQuizClick}>
            Quiz
          </button>
      </div>

        {/* Action Buttons: heart, comment, share, bookmark */}
        <div className="pc-actions-row">
          <button className={`pc-action-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
          {liked ? '♥' : '♡'}
        </button>
          <button className="pc-action-btn" onClick={() => setShowCommentsModal(true)}>💬</button>
          <button className="pc-action-btn">↗</button>
          <button 
            className={`pc-action-btn pc-bookmark ${bookmarked ? 'bookmarked' : ''}`} 
            onClick={() => setBookmarked(!bookmarked)}
          >
            🔖
          </button>
        </div>

        {/* Caption: username: caption */}
        <div className="pc-caption">
          <strong>{userName}</strong>: {post.caption}
        </div>

        {/* Date (small grey) - directly below caption */}
        <div className="pc-date">
          {formatDate(post.createdAt)}
        </div>

        {/* Comments Section */}
        <div className="pc-comments-section">
          <div className="pc-comments-label">Comments:</div>
          {loadingComments ? (
            <div className="pc-comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="pc-comments-empty">No comments yet.</div>
          ) : (
            <>
              {displayedComments.map((c) => {
                const commentUserName = c.user?.username || 'Anonymous';
                
                return (
                  <div className="pc-comment-item" key={c.objectId || c.createdAt || JSON.stringify(c)}>
                    <div className="pc-comment-left">
                      <span className="pc-comment-username">{commentUserName}:</span>
                      <span className="pc-comment-text">{c.text}</span>
                    </div>
                    <div className="pc-comment-date">{formatDate(c.createdAt)}</div>
                  </div>
                );
              })}
              {comments.length > 2 && (
                <button 
                  className="pc-see-more-comments" 
                  onClick={() => setShowCommentsModal(true)}
                >
                  more
                </button>
              )}
            </>
          )}

          {/* Comment Input - 75% width */}
          <div className="pc-comment-form-wrapper">
            <form className="pc-comment-form" onSubmit={handleCommentSubmit}>
              <input
                className="pc-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
              />
              <button 
                className="pc-comment-submit" 
                type="submit" 
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
            <button 
              className="pc-report-btn-bottom" 
              onClick={() => handleReport('post')}
              title="Report"
            >
              ⚠
            </button>
          </div>
      </div>
      </article>
      {showCommentsModal && (
        <CommentsModal post={post} onClose={() => setShowCommentsModal(false)} />
      )}
      {showReportModal && (
        <ReportModal 
          onClose={() => setShowReportModal(false)} 
          onSubmit={handleReportSubmit}
          contentType={reportContentType}
        />
      )}
      {showEditModal && (
        <EditPostModal 
          post={post} 
          onClose={() => setShowEditModal(false)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </>
  );
}
