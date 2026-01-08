import React, { useState } from "react";
import { createQuiz } from "../../Services/quiz";
import { getCurrentUser } from "../../Components/Auth/AuthService";
import { addScore, SCORE_POINTS } from "../../Services/score";
import "./CreateQuizModal.css";

// modal for creating a new quiz
export default function CreateQuizModal({ post, onClose, onQuizCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [submitting, setSubmitting] = useState(false);

  // updates an answer option
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // saves the quiz and gives points
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !options.filter(opt => opt.trim()).length >= 2 || correctAnswer === null) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = await getCurrentUser();
    const userId = currentUser && currentUser.id ? currentUser.id : null;
    if (!userId) {
      alert("You must be logged in to create a quiz");
      return;
    }

    setSubmitting(true);
    try {
      await createQuiz({
        postId: post.objectId,
        userId,
        question: question.trim(),
        options: options.filter(opt => opt.trim()),
        correctAnswer,
        difficulty
      });
      
      // gives points for making a quiz
      await addScore(SCORE_POINTS.CREATE_QUIZ, "Created a quiz");
      window.dispatchEvent(new Event("scoreUpdated"));
      
      if (onQuizCreated) {
        onQuizCreated();
      }
      onClose();
    } catch (err) {
      console.error("Error creating quiz:", err);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-quiz-overlay" onClick={onClose}>
      <div className="create-quiz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-quiz-header">
          <h3>Create Quiz</h3>
          <button className="create-quiz-close" onClick={onClose}>×</button>
        </div>
        <form className="create-quiz-form" onSubmit={handleSubmit}>
          <div className="create-quiz-field">
            <label>Question *</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              required
            />
          </div>

          <div className="create-quiz-field">
            <label>Options *</label>
            {options.map((option, index) => (
              <div key={index} className="create-quiz-option-row">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required={index < 2}
                />
                <button
                  type="button"
                  className={`create-quiz-correct-btn ${correctAnswer === index ? 'selected' : ''}`}
                  onClick={() => setCorrectAnswer(index)}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>

          <div className="create-quiz-field">
            <label>Difficulty *</label>
            <div className="create-quiz-difficulty-buttons">
              {['easy', 'medium', 'hard'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`create-quiz-difficulty-btn ${difficulty === diff ? 'selected' : ''}`}
                  onClick={() => setDifficulty(diff)}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="create-quiz-actions">
            <button type="button" className="create-quiz-btn create-quiz-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-quiz-btn create-quiz-btn-submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

