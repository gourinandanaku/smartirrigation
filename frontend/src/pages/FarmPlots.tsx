import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const crops = ["Tomato", "Wheat", "Rice", "Corn", "Soybean", "Cotton", "Potato"];

export default function FarmPlots() {

  const [plots, setPlots] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    crop: "",
    location: "",
    deviceId: "",
  });

  // Fetch plots from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/plots")
      .then((res) => res.json())
      .then((data) => setPlots(data))
      .catch((err) => console.log(err));
  }, []);

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add new plot
  const handleSubmit = async (e) => {
  e.preventDefault()

  if (!formData.name || !formData.crop || !formData.location || !formData.deviceId) {
    alert("Please fill all fields")
    return
  }

  try {
    const res = await fetch("http://localhost:5000/api/plots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })

    const data = await res.json()

    setPlots(prev => [...prev, data])

    setFormData({
      name: "",
      crop: "",
      location: "",
      deviceId: ""
    })

    setShowForm(false)

  } catch (error) {
    console.error(error)
    alert("Failed to add plot")
  }
}

  // Delete plot
  const deletePlot = async (id) => {
    await fetch(`http://localhost:5000/api/plots/${id}`, {
      method: "DELETE",
    });

    setPlots(plots.filter((plot) => plot._id !== id));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Farm Plots</h1>

      <p style={{ color: "gray" }}>
        Manage multiple plots; each has its own monitoring dashboard.
      </p>

      {/* Plot Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {plots.map((p) => (
          <div key={p._id} className="card" style={{ position: "relative", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            
            <button
              onClick={() => deletePlot(p._id)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ×
            </button>

            <h3>{p.name}</h3>

            <p>Crop: {p.crop}</p>

            <p>Location: {p.location}</p>

            <p>Device ID: {p.deviceId}</p>

            <Link
              to={`/sensors?plot=${p._id}&location=${encodeURIComponent(
                p.location
              )}&name=${encodeURIComponent(p.name)}`}
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "green",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Open dashboard →
            </Link>
          </div>
        ))}
      </div>

      {/* Add Plot Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          border: "1px dashed green",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        + Add new plot
      </button>

      {/* Popup Form */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "10px",
              width: "350px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add New Plot</h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Plot Name"
                value={formData.name}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />

              <select
                name="crop"
                value={formData.crop}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              >
                <option value="">Select Crop</option>
                {crops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />

              <input
                type="text"
                name="deviceId"
                placeholder="Device ID"
                value={formData.deviceId}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                Add Plot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}