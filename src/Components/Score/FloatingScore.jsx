import React, { useState, useEffect, useCallback } from "react";
import { getUserScore } from "../../Services/score";
import "./FloatingScore.css";

// floating score widget that can be dragged around
const FloatingScore = () => {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // loads the score and saved position when component starts
  useEffect(() => {
    const loadScore = async () => {
      const userScore = await getUserScore();
      setScore(userScore);
    };
    loadScore();

    // loads the saved position from storage
    const savedPosition = localStorage.getItem("floatingScorePosition");
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch (e) {
        // puts it in top right if no saved position
        setPosition({ x: window.innerWidth - 120, y: 20 });
      }
    } else {
      setPosition({ x: window.innerWidth - 120, y: 20 });
    }

    // listens for when score changes
    const handleScoreUpdate = () => {
      loadScore();
    };
    window.addEventListener("scoreUpdated", handleScoreUpdate);

    return () => {
      window.removeEventListener("scoreUpdated", handleScoreUpdate);
    };
  }, []);

  // moves the score widget if window gets resized
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        const savedPosition = localStorage.getItem("floatingScorePosition");
        if (savedPosition) {
          try {
            const pos = JSON.parse(savedPosition);
            // keeps it on screen
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 60;
            setPosition({
              x: Math.min(pos.x, maxX),
              y: Math.min(pos.y, maxY)
            });
          } catch (e) {}
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging]);

  // starts dragging when mouse clicks down
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // moves the widget while dragging
  const handleMouseMove = useCallback((e) => {
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // keeps it on screen
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 60;
    const minX = 0;
    const minY = 0;

    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    });
  }, [dragOffset]);

  // stops dragging and saves the new position
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setPosition((currentPos) => {
      localStorage.setItem("floatingScorePosition", JSON.stringify(currentPos));
      return currentPos;
    });
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`floating-score ${isDragging ? "dragging" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="floating-score-label">jacki score</div>
      <div className="floating-score-value">{score}</div>
    </div>
  );
};

export default FloatingScore;

