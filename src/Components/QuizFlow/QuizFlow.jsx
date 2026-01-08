import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizzesForPost } from "../../Services/quiz";
import { addScore, SCORE_POINTS, getCompletedQuizzes, markQuizCompleted } from "../../Services/score";
import "./QuizFlow.css";

// shows quizzes one question at a time
export default function QuizFlow() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // loads quizzes and hides ones already done
  useEffect(() => {
    if (!postId) {
      setError("No post ID provided");
      setLoading(false);
      return;
    }

    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const [data, completedIds] = await Promise.all([
          getQuizzesForPost(postId),
          getCompletedQuizzes()
        ]);
        const validQuizzes = (data || []).filter(
          (q) => q.question && q.options && q.options.length >= 2 && q.correctAnswer !== null && q.correctAnswer !== undefined
        );
        
        // hides quizzes the user already finished
        const availableQuizzes = validQuizzes.filter(
          q => !completedIds.includes(q.objectId)
        );
        
        if (availableQuizzes.length === 0) {
          if (validQuizzes.length > 0) {
            setError("All quizzes for this post have been completed!");
          } else {
            setError("No quizzes available for this post");
          }
        } else {
          // mixes up the order
          const shuffled = [...availableQuizzes].sort(() => Math.random() - 0.5);
          setQuizzes(shuffled);
        }
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [postId]);

  const currentQuiz = quizzes[currentIndex];

  // picks an answer option
  const handleAnswerSelect = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  // checks if answer is right and gives points
  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    if (selectedAnswer === currentQuiz.correctAnswer) {
      setScore(score + 1);
      
      // marks this quiz as done
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

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "#28a745";
      case "medium":
        return "#ffc107";
      case "hard":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">Loading quizzes...</div>
      </div>
    );
  }

  if (error || quizzes.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <p>{error || "No quizzes available"}</p>
          <button className="btn btn-primary" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex === quizzes.length - 1;
  const isCorrect = selectedAnswer === currentQuiz.correctAnswer;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="quiz-back-btn" onClick={handleBack}>
          ← Back
        </button>
        <div className="quiz-progress">
          Question {currentIndex + 1} of {quizzes.length}
        </div>
      </div>

      <div className="quiz-card">
        {/* Difficulty Badge */}
        <div 
          className="quiz-difficulty"
          style={{ backgroundColor: getDifficultyColor(currentQuiz.difficulty) }}
        >
          {currentQuiz.difficulty ? currentQuiz.difficulty.charAt(0).toUpperCase() + currentQuiz.difficulty.slice(1) : "Unknown"}
        </div>

        {/* Question */}
        <h2 className="quiz-question">{currentQuiz.question}</h2>

        {/* Answer Options */}
        <div className="quiz-options">
          {currentQuiz.options.map((option, index) => {
            let optionClass = "quiz-option";
            if (showResult) {
              if (index === currentQuiz.correctAnswer) {
                optionClass += " quiz-option-correct";
              } else if (index === selectedAnswer && index !== currentQuiz.correctAnswer) {
                optionClass += " quiz-option-incorrect";
              }
            } else if (selectedAnswer === index) {
              optionClass += " quiz-option-selected";
            }

            return (
              <button
                key={index}
                className={optionClass}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showResult && (
          <div className={`quiz-feedback ${isCorrect ? "quiz-feedback-correct" : "quiz-feedback-incorrect"}`}>
            {isCorrect ? (
              <div>
                <strong>✓ Correct!</strong>
                <p>Great job! You got it right.</p>
              </div>
            ) : (
              <div>
                <strong>✗ Incorrect</strong>
                <p>The correct answer is: <strong>{currentQuiz.options[currentQuiz.correctAnswer]}</strong></p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="quiz-actions">
          {!showResult ? (
            <button
              className="btn btn-primary btn-submit"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </button>
          ) : (
            <>
              {!isLastQuestion ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Next Question →
                </button>
              ) : (
                <div className="quiz-complete">
                  <h3>Quiz Complete!</h3>
                  <p>You scored {score} out of {quizzes.length}</p>
                  <div className="quiz-complete-actions">
                    <button className="btn btn-primary" onClick={handleBack}>
                      Back to Post
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

