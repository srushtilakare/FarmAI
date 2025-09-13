import { useState } from "react";
import "./AdvisoryOutput.css";

export default function AdvisoryOutput() {
  const initialAdvisories = [
    {
      id: 1,
      crop: "Wheat",
      disease: "Leaf Rust",
      treatment: "Apply fungicide XYZ",
      preventive: "Use resistant seeds, proper spacing",
      image: "https://via.placeholder.com/150",
      center: "Agri Support Center, Village ABC",
      localized: "स्थानीय सलाह: रोग प्रतिरोधी बीज उपयोग करें"
    },
    {
      id: 2,
      crop: "Rice",
      disease: "Blast",
      treatment: "Use fungicide ABC",
      preventive: "Avoid excess nitrogen fertilizer",
      image: "https://via.placeholder.com/150",
      center: "Agri Support Center, Village XYZ",
      localized: "स्थानीय सलाह: अधिक नाइट्रोजन उर्वरक से बचें"
    }
  ];

  const [advisories, setAdvisories] = useState(initialAdvisories);
  const [feedback, setFeedback] = useState({}); // {1: "yes", 2: "no"}

  const handleFeedback = (id, response) => {
    setFeedback((prev) => ({ ...prev, [id]: response }));
  };

  const handleMarkResolved = (id) => {
    setAdvisories((prev) => prev.filter((adv) => adv.id !== id));
  };

  const handleShare = (adv) => {
    const message = `Crop: ${adv.crop}\nDisease: ${adv.disease}\nTreatment: ${adv.treatment}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="advisory-container">
      <h1>AI Advisory Recommendations</h1>

      <div className="advisory-cards">
        {advisories.map((adv) => (
          <div key={adv.id} className="advisory-card">
            <img src={adv.image} alt={adv.crop} />
            <h2>{adv.crop}</h2>
            <p><strong>Disease:</strong> {adv.disease}</p>
            <p><strong>Treatment:</strong> {adv.treatment}</p>
            <p><strong>Preventive Measures:</strong> {adv.preventive}</p>
            <p><strong>Nearest Support Center:</strong> {adv.center}</p>
            <p><strong>Localized Advisory:</strong> {adv.localized}</p>

            {/* Feedback */}
            <div className="feedback-section">
              <p>Was this useful?</p>
              <button
                className={feedback[adv.id] === "yes" ? "selected" : ""}
                onClick={() => handleFeedback(adv.id, "yes")}
              >
                Yes
              </button>
              <button
                className={feedback[adv.id] === "no" ? "selected" : ""}
                onClick={() => handleFeedback(adv.id, "no")}
              >
                No
              </button>
            </div>

            <div className="advisory-actions">
              <button onClick={() => handleMarkResolved(adv.id)}>
                Mark Resolved
              </button>
              <button onClick={() => handleShare(adv)}>
                Share via WhatsApp
              </button>
              <button onClick={() => window.print()}>
                Save / Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
