import React, { useState, useEffect, useRef } from "react";
import { addScore, SCORE_POINTS } from "../../Services/score";
import "./InAppBrowser.css";

// shows an article in an iframe with a timer
export default function InAppBrowser({ url, onClose }) {
  const [timeRemaining, setTimeRemaining] = useState(150); // 2:30 in seconds
  const [timerActive, setTimerActive] = useState(true);
  const pointsAwardedRef = useRef(false); // stops giving points twice

  // counts down the timer and gives points when done
  useEffect(() => {
    if (!timerActive || pointsAwardedRef.current) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          // gives points only once when timer hits zero
          if (!pointsAwardedRef.current) {
            pointsAwardedRef.current = true;
            addScore(SCORE_POINTS.READ_ARTICLE, "Read article for 2:30");
            window.dispatchEvent(new Event("scoreUpdated"));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // turns seconds into minutes:seconds format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!url) return null;

  return (
    <div className="browser-overlay" onClick={onClose}>
      <div className="browser-container" onClick={(e) => e.stopPropagation()}>
        <div className="browser-header">
          <div className="browser-timer">
            {timerActive && !pointsAwardedRef.current ? (
              <span className="timer-countdown">{formatTime(timeRemaining)}</span>
            ) : pointsAwardedRef.current ? (
              <span className="timer-complete">✓ Points earned!</span>
            ) : null}
          </div>
          <div className="browser-url">{url}</div>
          <button className="browser-close" onClick={onClose}>×</button>
        </div>
        <iframe
          src={url}
          className="browser-iframe"
          title="External Content"
          allow="fullscreen"
        />
        <div className="browser-footer">
          <button className="browser-back-btn" onClick={onClose}>
            ← Back to Jacki
          </button>
        </div>
      </div>
    </div>
  );
}

