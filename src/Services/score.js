import Parse from "parse";
import { getCurrentUser } from "../Components/Auth/AuthService";

// defines how many points each action gives
export const SCORE_POINTS = {
  QUIZ_EASY: 10,
  QUIZ_MEDIUM: 30,
  QUIZ_HARD: 50,
  CREATE_POST: 400,
  CREATE_QUIZ: 200,
  READ_ARTICLE: 100
};

// gets the user's current score number
export const getUserScore = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;
    
    const score = user.get("jackiScore");
    return score ? parseInt(score) : 0;
  } catch (error) {
    console.error("Error getting user score:", error);
    return 0;
  }
};

// adds points to the user's score and saves it
export const addScore = async (points, reason) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    const currentScore = user.get("jackiScore") || 0;
    const newScore = parseInt(currentScore) + points;
    
    user.set("jackiScore", newScore.toString());
    await user.save();

    // saves the event to history
    await logScoreEvent(points, reason);

    return true;
  } catch (error) {
    console.error("Error adding score:", error);
    return false;
  }
};

// saves a score event to the history list
export const logScoreEvent = async (points, reason) => {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const ScoreEvent = Parse.Object.extend("ScoreEvent");
    const event = new ScoreEvent();
    event.set("userId", user);
    event.set("points", points);
    event.set("reason", reason);
    event.set("timestamp", new Date());
    
    await event.save();
  } catch (error) {
    console.error("Error logging score event:", error);
  }
};

// gets all the score events for the dashboard
export const getScoreHistory = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const ScoreEvent = Parse.Object.extend("ScoreEvent");
    const query = new Parse.Query(ScoreEvent);
    query.equalTo("userId", user);
    query.descending("timestamp");
    query.limit(100);

    const results = await query.find();
    return results.map(event => ({
      points: event.get("points"),
      reason: event.get("reason"),
      timestamp: event.get("timestamp")
    }));
  } catch (error) {
    console.error("Error getting score history:", error);
    return [];
  }
};

// gets the list of quiz ids the user already finished
export const getCompletedQuizzes = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const completedQuizzes = user.get("completedQuizzes");
    return Array.isArray(completedQuizzes) ? completedQuizzes : [];
  } catch (error) {
    console.error("Error getting completed quizzes:", error);
    return [];
  }
};

// marks a quiz as done so user can't do it again
export const markQuizCompleted = async (quizId) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    const completedQuizzes = user.get("completedQuizzes") || [];
    if (!Array.isArray(completedQuizzes)) {
      user.set("completedQuizzes", [quizId]);
    } else if (!completedQuizzes.includes(quizId)) {
      completedQuizzes.push(quizId);
      user.set("completedQuizzes", completedQuizzes);
    } else {
      return true;
    }
    
    await user.save();
    return true;
  } catch (error) {
    console.error("Error marking quiz as completed:", error);
    return false;
  }
};

