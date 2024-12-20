import React, { useState } from "react";
import databaseSchema from "../data/databaseSchema";

const AttributeSearch = ({ onSelectAttribute }) => {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredAttributes = databaseSchema.tables
    .flatMap((table) => table.attributes.map((attr) => ({ table: table.name, attr })))
    .filter(({ attr }) => attr.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <input
        type="text"
        placeholder="Search attributes..."
        value={search}
        onChange={handleSearch}
        className="form-control mb-2"
      />
      <ul className="list-group">
        {filteredAttributes.map(({ table, attr }, idx) => (
          <li
            key={idx}
            className="list-group-item"
            onClick={() => onSelectAttribute(table, attr)}
          >
            {attr} (Table: {table})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttributeSearch;
