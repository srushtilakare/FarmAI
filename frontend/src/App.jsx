import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import FarmerInteraction from "./pages/FarmerInteraction";
import AIProcessing from "./pages/AIProcessing";
import AdvisoryOutput from "./pages/AdvisoryOutput";

export default function App() {
  return (
    <Router>
      {/* Navbar is always visible */}
      <Navbar />

      {/* Define all routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interact" element={<FarmerInteraction />} />
        <Route path="/ai-processing" element={<AIProcessing />} />
        <Route path="/advisory" element={<AdvisoryOutput />} />
      </Routes>
    </Router>
  );
}
