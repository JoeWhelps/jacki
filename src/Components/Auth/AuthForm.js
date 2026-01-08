import React from "react";
import "./auth.css";

// auth form
// presentational form used by login and register pages
// keeps layout consistent and applies theme styles
const AuthForm = ({ user, isLogin, onChange, onSubmit }) => {
  return (
    <form className="auth-form" onSubmit={onSubmit} autoComplete="off">
      {!isLogin ? (
        <div>
          <div className="form-group">
            <label>First Name</label>
            <br />
            <input
              type="text"
              className="form-control auth-input"
              id="first-name-input"
              value={user.firstName}
              onChange={onChange}
              name="firstName"
              placeholder="first name"
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <br />
            <input
              type="text"
              className="form-control auth-input"
              id="last-name-input"
              value={user.lastName}
              onChange={onChange}
              name="lastName"
              required
            />
          </div>{" "}
        </div>
      ) : (
        <></>
      )}
      <div>
        <div className="form-group">
          <label>Email</label>
          <br />
          <input
            type="email"
            className="form-control auth-input"
            id="email-input"
            value={user.email}
            onChange={onChange}
            name="email"
            required
          />
        </div>{" "}
        <div className="form-group">
          <label>Password</label>
          <br />
          <input
            type="password"
            className="form-control auth-input"
            id="password-input"
            value={user.password}
            onChange={onChange}
            name="password"
            min="0"
            required
          />
        </div>
        <div className="form-group">
          <button type="submit" className="btn auth-submit" onSubmit={onSubmit}>
            Submit
          </button>
        </div>
      </div>
    </form>
  );
};

export default AuthForm;
