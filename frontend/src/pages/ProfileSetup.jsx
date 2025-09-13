import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function ProfileSetup() {
  const navigate = useNavigate();

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Placeholder: You will send this data to backend later
    alert("Profile saved successfully!");
    navigate("/dashboard"); // redirect to user dashboard
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleProfileSubmit}>
        <h2>Setup Your Farmer Profile</h2>

        <label>Name</label>
        <input type="text" placeholder="Enter your name" required />

        <label>Age</label>
        <input type="number" placeholder="Enter your age" required />

        <label>Gender</label>
        <select required>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label>Location (Village, District, State)</label>
        <input type="text" placeholder="Enter location" required />

        <label>Farm Size (in acres)</label>
        <input type="number" placeholder="Enter farm size" required />

        <label>Crops Usually Grown</label>
        <input type="text" placeholder="E.g., Wheat, Rice" required />

        <label>Preferred Language</label>
        <select required>
          <option value="">Select language</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>

        <label>Contact Number / WhatsApp</label>
        <input type="text" placeholder="Enter contact number" required />

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
