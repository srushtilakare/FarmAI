import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Placeholder for registration
    alert("Registration successful!");
    navigate("/profile-setup"); // redirect to profile setup
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Create a FarmAI Account</h2>
        <label>Name</label>
        <input type="text" placeholder="Enter your name" required />

        <label>Email or Phone</label>
        <input type="text" placeholder="Enter your email or phone" required />

        <label>Password</label>
        <input type="password" placeholder="Enter your password" required />

        <button type="submit">Register</button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}
