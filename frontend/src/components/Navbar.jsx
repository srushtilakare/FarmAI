import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  // Placeholder: replace with actual auth state later
  const isLoggedIn = true; // change to false to test logged-out state

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">🌱 FarmAI</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>

        {isLoggedIn ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile-setup">Profile Setup</Link>
            <button className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
