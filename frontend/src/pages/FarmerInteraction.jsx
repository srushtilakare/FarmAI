import { useNavigate } from "react-router-dom";

export default function FarmerInteraction() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1️⃣ Normally you would send form data to backend here
    // 2️⃣ Then navigate to AI Processing page
    navigate("/ai-processing");
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your input fields */}
      <input type="text" placeholder="Soil Type" required />
      <input type="file" />
      <textarea placeholder="Symptoms"></textarea>
      <button type="submit">Submit</button>
    </form>
  );
}
