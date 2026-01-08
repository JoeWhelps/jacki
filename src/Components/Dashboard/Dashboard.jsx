import React, { useState, useEffect } from "react";
import { getUserScore, getScoreHistory } from "../../Services/score";
import { formatDate } from "../../utils/dateFormatter";
import "./Dashboard.css";

// shows the user's score and all the points they earned
const Dashboard = () => {
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // loads the score and history when page opens
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const userScore = await getUserScore();
      const scoreHistory = await getScoreHistory();
      setScore(userScore);
      setHistory(scoreHistory);
      setLoading(false);
    };
    loadData();

    // listens for when score changes
    const handleScoreUpdate = () => {
      loadData();
    };
    window.addEventListener("scoreUpdated", handleScoreUpdate);

    return () => {
      window.removeEventListener("scoreUpdated", handleScoreUpdate);
    };
  }, []);

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="dashboard-score-card">
        <div className="dashboard-score-label">Your jacki Score</div>
        <div className="dashboard-score-value">{score}</div>
      </div>

      <div className="dashboard-history">
        <h2 className="dashboard-history-title">Points History</h2>
        {history.length === 0 ? (
          <p className="dashboard-empty">No points earned yet. Start creating posts, taking quizzes, or reading articles!</p>
        ) : (
          <div className="dashboard-history-list">
            {history.map((event, index) => (
              <div key={index} className="dashboard-history-item">
                <div className="dashboard-history-points">+{event.points}</div>
                <div className="dashboard-history-details">
                  <div className="dashboard-history-reason">{event.reason}</div>
                  <div className="dashboard-history-date">
                    {event.timestamp ? formatDate(new Date(event.timestamp)) : "Recently"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

