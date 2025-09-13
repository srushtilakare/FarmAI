import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>🌱 FarmAI - Smart Farming Assistant</h1>
          <p>
            Get AI-powered advice for crop health, soil, and farm productivity.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-hero-register">Register</Link>
            <Link to="/login" className="btn-hero-login">Login</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://i.imgur.com/1bX5QH6.png" alt="Farm AI" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why FarmAI?</h2>
        <div className="feature-cards">
          <div className="card">
            <h3>AI Crop Diagnosis</h3>
            <p>Detect diseases and pests using image & text inputs.</p>
          </div>
          <div className="card">
            <h3>Personalized Advice</h3>
            <p>Get recommendations based on your farm profile.</p>
          </div>
          <div className="card">
            <h3>Local Agri Support</h3>
            <p>Find nearby experts and government schemes easily.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
