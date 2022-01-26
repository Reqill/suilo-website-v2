import React, { useEffect } from "react";

const NotFound = ({ setPage, msg }) => {
  useEffect(() => {
    setPage("notFound");
  }, []);
  return (
    <div style={{ minHeight: "89vh" }}>
      <p>Nie znaleziono zasobu, którego szukasz.</p>
      {msg && <small>{msg}</small>}
    </div>
  );
};

export default NotFound;
