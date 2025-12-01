import { useState, useEffect } from "react";

const ThemeSettings = () => {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem("bodyBackgroundColor");
    if (savedColor) {
      setBgColor(savedColor);
      document.body.style.backgroundColor = savedColor;
    }
  }, []);

  const handleColorChange = (e) => {
    const color = e.target.value;
    setBgColor(color);
    document.body.style.backgroundColor = color;
    localStorage.setItem("bodyBackgroundColor", color);
  };

  return (
    <div
      style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          color: "#333",
        }}
        title="Change Background Color"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="#333333"
            d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            right: "0",
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            minWidth: "150px",
          }}
        >
          <label
            style={{
              fontSize: "14px",
              color: "#333",
              marginBottom: "5px",
              display: "block",
            }}
          >
            Background Color
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="color"
              value={bgColor}
              onChange={handleColorChange}
              style={{
                width: "40px",
                height: "40px",
                cursor: "pointer",
                border: "none",
                padding: 0,
                background: "none",
              }}
            />
            <span style={{ fontSize: "12px", color: "#666" }}>{bgColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSettings;
