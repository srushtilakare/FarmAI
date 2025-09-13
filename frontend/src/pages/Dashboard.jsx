import "./Dashboard.css";

export default function Dashboard() {
  const farmerProfile = {
    name: "Ramesh Kumar",
    age: 35,
    gender: "Male",
    location: "Village ABC, District XYZ, State PQR",
    farmSize: "5 acres",
    crops: "Wheat, Rice",
  };

  const recentAdvisories = [
    { id: 1, crop: "Wheat", disease: "Leaf Rust", date: "2025-09-10" },
    { id: 2, crop: "Rice", disease: "Blast", date: "2025-09-12" },
  ];

  return (
    <div className="dashboard-container">
      <h1>Welcome, {farmerProfile.name}</h1>

      {/* Profile Summary */}
      <section className="profile-card">
        <h2>Profile Summary</h2>
        <p><strong>Age:</strong> {farmerProfile.age}</p>
        <p><strong>Gender:</strong> {farmerProfile.gender}</p>
        <p><strong>Location:</strong> {farmerProfile.location}</p>
        <p><strong>Farm Size:</strong> {farmerProfile.farmSize}</p>
        <p><strong>Crops:</strong> {farmerProfile.crops}</p>
      </section>

      {/* Action Cards */}
      <section className="action-cards">
        <div className="action-card" onClick={() => window.location.href="/interact"}>
          🌱 <span>Enter Farm Details</span>
        </div>
        <div className="action-card" onClick={() => window.location.href="/dashboard#advisories"}>
          📄 <span>View Past Advisories</span>
        </div>
        <div className="action-card" onClick={() => window.location.href="/profile-setup"}>
          🛠 <span>Update Profile</span>
        </div>
        <div className="action-card" onClick={() => window.location.href="/feedback"}>
          💬 <span>Give Feedback</span>
        </div>
      </section>

      {/* Recent Advisories */}
      <section id="advisories" className="advisory-section">
        <h2>Recent AI Advisories</h2>
        <div className="advisory-cards">
          {recentAdvisories.map((adv) => (
            <div className="advisory-card" key={adv.id}>
              <h3>{adv.crop}</h3>
              <p><strong>Disease:</strong> {adv.disease}</p>
              <p><strong>Date:</strong> {adv.date}</p>
              <button>View Details</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
