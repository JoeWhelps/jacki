// CreatePost: Code to allow the user to create a Post with three-level structure
// Level 1: Video/Image post
// Level 2: AI-generated topic summary (editable, 200 char limit)
// Level 3: Quizzes related to the topic
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost as persistPost } from "../../Services/service";
import { getCurrentUser } from "../Auth/AuthService";
import { searchTopic } from "../../Services/huggingface";
import { createQuiz } from "../../Services/quiz";
import { addScore, SCORE_POINTS } from "../../Services/score";
import "./CreatePost.css";

// create post view
// builds a post object from the current user and form fields,
// then persists via the service which prefers parse when configured

export default function CreatePost({ users, onCreate }) {
  // Level 1: Basic post fields
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [allowComments, setAllowComments] = useState(true);
  
  // Level 2: Topic summary
  const [topicSearch, setTopicSearch] = useState("");
  const [aiResponse, setAiResponse] = useState({ summary: "", link: "" }); // AI response (display only, not saved)
  const [topicSummary, setTopicSummary] = useState(""); // User's summary (300 chars, saved)
  const [furtherReadingLink, setFurtherReadingLink] = useState(""); // Link for further reading
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Level 3: Quizzes
  const [quizzes, setQuizzes] = useState([]);
  
  console.debug('CreatePost: users prop length=', (users && users.length) || 0);

  const navigate = useNavigate();

  // Handle topic search via Hugging Face
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
      setAiResponse(response); // Display AI response (not saved) - {summary, link}
    } catch (error) {
      console.error("Error searching topic:", error);
      setSearchError(error.message || "Failed to search topic. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding AI summary to user's summary field
  const handleAddSummary = () => {
    if (aiResponse.summary) {
      setTopicSummary(aiResponse.summary.substring(0, 2500));
    }
  };

  // Handle adding AI link to user's link field
  const handleAddLink = () => {
    if (aiResponse.link) {
      setFurtherReadingLink(aiResponse.link);
    }
  };

  // Handle topic summary change with character limit (2500 chars)
  const handleSummaryChange = (e) => {
    const value = e.target.value;
    if (value.length <= 2500) {
      setTopicSummary(value);
    }
  };

  // Add a new quiz
  const addQuiz = () => {
    const newQuiz = {
      id: `quiz_${Date.now()}_${Math.random()}`,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: null, // Will be set by user
      difficulty: null, // Will be set by user (easy, medium, hard)
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  // Remove a quiz
  const removeQuiz = (quizId) => {
    setQuizzes(quizzes.filter((q) => q.id !== quizId));
  };

  // Update quiz field
  const updateQuiz = (quizId, field, value) => {
    setQuizzes(
      quizzes.map((q) => {
        if (q.id === quizId) {
          return { ...q, [field]: value };
        }
        return q;
      })
    );
  };

  // Update quiz option
  const updateQuizOption = (quizId, optionIndex, value) => {
    setQuizzes(
      quizzes.map((q) => {
        if (q.id === quizId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let mediaData = "";
    let mediaType = null;
    
    if (file) {
      mediaData = await toBase64(file);
      // Determine if it's a video or image
      if (file.type.startsWith("video/")) {
        mediaType = "video";
      } else if (file.type.startsWith("image/")) {
        mediaType = "image";
      }
    }
    
    // Get current user and their ID
    const cur = await getCurrentUser();
    console.debug("CreatePost: getCurrentUser returned", cur);
    const userId = cur && cur.id ? cur.id : null;
    
    if (!userId) {
      alert("You must be logged in to create a post");
      return;
    }

    // Prepare post data (without quizzes - they'll be created separately)
    const newPost = {
      id: `post_${Date.now()}`,
      userId, // Pass userId for user pointer
      caption,
      hasImage: mediaType === "image" && !!mediaData,
      hasVideo: mediaType === "video" && !!mediaData,
      imageData: mediaType === "image" ? mediaData : "",
      videoData: mediaType === "video" ? mediaData : "",
      mediaType,
      categories: [],
      allowComments,
      // Level 2: Topic summary
      topicSummary: topicSummary.trim(),
      furtherReadingLink: furtherReadingLink.trim(),
      // Note: quizzes are NOT included here - they'll be created separately
    };

    // saves the post to the database
    const saved = await persistPost(newPost);
    console.debug('CreatePost: saved response:', saved);
    
    // gives points for making a post
    await addScore(SCORE_POINTS.CREATE_POST, "Created a post");
    window.dispatchEvent(new Event("scoreUpdated"));
    
    // gets the post id to link quizzes to it
    const postId = saved?.objectId || saved?.id || newPost.id;
    
    // cleans up the quiz data
    const validQuizzes = quizzes
      .map((q) => ({
        question: q.question,
        options: q.options.filter((opt) => opt.trim() !== ""),
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
      }))
      .filter((q) => q.question.trim() !== "" && q.options.length >= 2 && q.correctAnswer !== null && q.difficulty !== null);
    
    // creates each quiz and gives points for each one
    const createdQuizzes = [];
    for (const quiz of validQuizzes) {
      try {
        const createdQuiz = await createQuiz({
          postId,
          userId,
          question: quiz.question,
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
          difficulty: quiz.difficulty,
        });
        createdQuizzes.push(createdQuiz);
        console.debug('CreatePost: created quiz', createdQuiz);
        
        // gives points for making a quiz
        await addScore(SCORE_POINTS.CREATE_QUIZ, "Created a quiz");
        window.dispatchEvent(new Event("scoreUpdated"));
      } catch (quizError) {
        console.error('CreatePost: failed to create quiz', quizError);
      }
    }

    // Notify parent UI and navigate back to main
    try {
      if (onCreate) onCreate(saved || newPost);
    } catch (err) {
      console.error('onCreate handler failed:', err);
    }
    
    // Reset form
    setCaption("");
    setFile(null);
    setTopicSearch("");
    setAiResponse({ summary: "", link: "" });
    setTopicSummary("");
    setFurtherReadingLink("");
    setQuizzes([]);
    navigate('/');
  };

  return (
    <div className="create-post-container">
      <form onSubmit={handleSubmit} className="create-post-form">
        <h1>Create a Post</h1>
        
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
              Upload Video or Image (jpg or png only)
            </label>
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
          
          {/* AI Search - displays response but doesn't save it */}
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
            
            {/* Display AI Response (read-only, for reference) */}
            {(aiResponse.summary || aiResponse.link) && (
              <div className="ai-response-display">
                <label className="form-label">AI Response (for reference only)</label>
                
                {/* AI Summary with Add button */}
                {aiResponse.summary && (
                  <div className="ai-response-item">
                    <div className="ai-response-header">
                      <span className="ai-response-label">Summary:</span>
                      <button 
                        type="button"
                        onClick={handleAddSummary}
                        className="btn btn-add-small"
                        title="Add to summary field"
                      >
                        Add
                      </button>
                    </div>
                    <div className="ai-response-text">{aiResponse.summary}</div>
                  </div>
                )}
                
                {/* AI Link with Add button */}
                {aiResponse.link && (
                  <div className="ai-response-item">
                    <div className="ai-response-header">
                      <span className="ai-response-label">Link:</span>
                      <button 
                        type="button"
                        onClick={handleAddLink}
                        className="btn btn-add-small"
                        title="Add to link field"
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
          
          {/* User's Summary (1000 chars, saved) */}
          <div className="summary-editor">
            <label htmlFor="topic-summary" className="form-label">
              Your Summary (max 2500 characters) *
            </label>
            <textarea
              id="topic-summary"
              value={topicSummary}
              onChange={handleSummaryChange}
              className="form-input summary-textarea"
              placeholder="Write your own summary or use the AI response above as inspiration..."
              rows={4}
              maxLength={2500}
            />
            <div className="char-count">
              {topicSummary.length}/2500 characters
            </div>
          </div>

          {/* Further Reading Link */}
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

        {/* Level 3: Quizzes */}
        <section className="post-section">
          <h2>Quizzes (Level 3)</h2>
          <button 
            type="button" 
            onClick={addQuiz}
            className="btn btn-secondary"
          >
            + Add Quiz
          </button>
          
          {quizzes.map((quiz, index) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-header">
                <h3>Quiz {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuiz(quiz.id)}
                  className="btn btn-danger btn-small"
                >
                  Remove
                </button>
              </div>
              
              <div className="quiz-question">
                <label className="form-label">Question</label>
                <input
                  type="text"
                  value={quiz.question}
                  onChange={(e) => updateQuiz(quiz.id, "question", e.target.value)}
                  className="form-input"
                  placeholder="Enter your question..."
                />
              </div>
              
              <div className="quiz-options">
                <label className="form-label">Answer Options</label>
                {quiz.options.map((option, optIndex) => (
                  <div key={optIndex} className="option-row">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateQuizOption(quiz.id, optIndex, e.target.value)}
                      className="form-input option-input"
                      placeholder={`Option ${optIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer Selection */}
              <div className="correct-answer-selection">
                <label className="form-label">Select Correct Answer</label>
                <div className="answer-buttons">
                  {[1, 2, 3, 4].map((num) => {
                    const index = num - 1;
                    const isSelected = quiz.correctAnswer === index;
                    const hasOption = quiz.options[index] && quiz.options[index].trim() !== "";
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateQuiz(quiz.id, "correctAnswer", index)}
                        className={`btn answer-btn ${isSelected ? "btn-selected" : "btn-outline"}`}
                        disabled={!hasOption}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="difficulty-selection">
                <label className="form-label">Difficulty Level</label>
                <div className="difficulty-buttons">
                  {["easy", "medium", "hard"].map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => updateQuiz(quiz.id, "difficulty", difficulty)}
                      className={`btn difficulty-btn ${
                        quiz.difficulty === difficulty ? "btn-selected" : "btn-outline"
                      }`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {quizzes.length === 0 && (
            <p className="helper-text">Click "Add Quiz" to create quiz questions for this post.</p>
          )}
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn-submit">
            Submit for Review
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="btn btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}
