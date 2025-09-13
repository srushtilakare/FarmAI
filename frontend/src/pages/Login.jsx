import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Placeholder for auth
    alert("Login successful!");
    navigate("/dashboard"); // redirect after login
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Login to FarmAI</h2>
        <label>Email or Phone</label>
        <input type="text" placeholder="Enter your email or phone" required />

        <label>Password</label>
        <input type="password" placeholder="Enter your password" required />

        <button type="submit">Login</button>

        <p>
          New user? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
