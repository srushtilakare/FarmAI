import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AIProcessing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate AI processing delay (e.g., 3s)
    const timer = setTimeout(() => {
      navigate("/advisory"); // Redirect to AdvisoryOutput after processing
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Analyzing your farm data with AI models...</h2>
      <progress style={{ width: "80%", marginTop: "1rem" }} />
    </div>
  );
}
