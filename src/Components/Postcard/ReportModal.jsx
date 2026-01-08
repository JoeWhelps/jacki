import React, { useState } from "react";
import "./ReportModal.css";

export default function ReportModal({ onClose, onSubmit, contentType = "post" }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(reason.trim());
      }
      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-header">
          <h3>Report {contentType}</h3>
          <button className="report-close" onClick={onClose}>×</button>
        </div>
        <form className="report-form" onSubmit={handleSubmit}>
          <label htmlFor="report-reason">Why are you reporting this {contentType}?</label>
          <textarea
            id="report-reason"
            className="report-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason..."
            rows={5}
            required
          />
          <div className="report-actions">
            <button type="button" className="report-btn report-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="report-btn report-btn-submit" disabled={!reason.trim() || submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

