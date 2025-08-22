import React from "react";

interface MusicBarProps {
  active: boolean;
  subdivisions: number;
  activeSubdivision: number | null; // viene de Daw
}

const MusicBar: React.FC<MusicBarProps> = ({
  active,
  subdivisions,
  activeSubdivision,
}) => {
  return (
    <div
      style={{
        display: "flex",
        border: `2px solid ${active ? "blue" : "gray"}`,
        padding: "4px",
        borderRadius: "4px",
      }}
    >
      {Array.from({ length: subdivisions }).map((_, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: "50px",
            margin: "0 2px",
            backgroundColor:
              active && activeSubdivision === index ? "blue" : "lightgray",
            transition: "background-color 0.1s linear",
          }}
        />
      ))}
    </div>
  );
};

export default MusicBar;