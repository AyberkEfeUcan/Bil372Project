import React, { useState, useEffect } from "react";
import "./TableView.css";

const TableView = ({ table, onBack }) => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState(
    table.attributes.reduce((acc, attribute) => {
      acc[attribute] = { value: "", operator: "" };
      return acc;
    }, {})
  );
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from the backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error state before each fetch

      try {
        const queryParams = new URLSearchParams();
        
        // Add sorting configuration to query parameters
        if (sortConfig.key) {
          queryParams.append("sort_key", sortConfig.key);
          queryParams.append("sort_direction", sortConfig.direction);
        }

        // Add filters to query parameters
        Object.keys(filters).forEach((attribute) => {
          const filter = filters[attribute];
          if (filter.value) {
            queryParams.append(`${attribute}_value`, filter.value);
            queryParams.append(`${attribute}_operator`, filter.operator);
          }
        });

        const response = await fetch(
          `http://localhost:5000/table/${table.name}?${queryParams.toString()}`
        );
        const result = await response.json();

        if (response.ok) {
          setData(result.data);
        } else {
          setError("Error fetching data: " + result.message || "Unknown error");
        }
      } catch (error) {
        setError("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table.name, sortConfig, filters]);

  // Sorting request
  const requestSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // Handle filter change
  const handleFilterChange = (e, attribute) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [attribute]: {
        ...filters[attribute],
        [name]: value,
      },
    });
  };

  // Function to handle row click and open a new tab with related details
  const viewRowDetails = async (row) => {
    const relatedTables = table.relations || []; // Ensure related tables are passed
    console.log(relatedTables);

    let rowDetailsData = { related_tables: [] };

    if (relatedTables.length > 0) {
      try {
        const primaryKey = row[table.attributes[0]];

        const response = await fetch(
          `http://localhost:5000/table/${table.name}?filter_value=${primaryKey}&related_tables=${relatedTables.join(',')}`
        );
        rowDetailsData = await response.json();
      } catch (error) {
        console.error("Error fetching related data:", error);
      }
    }

    // Ensure related_tables is always an array before using it
    const relatedTablesData = Array.isArray(rowDetailsData.related_tables)
      ? rowDetailsData.related_tables
      : [];

    // Generate HTML content for the row details
    const rowDetails = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f9f9f9;
              margin: 0;
              padding: 20px;
            }
            h2 {
              color: #333;
              margin-bottom: 10px;
            }
            .details-container {
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .row-detail {
              margin-bottom: 10px;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .row-detail strong {
              color: #555;
            }
            .related-table {
              margin-top: 20px;
              padding: 15px;
              background-color: #f0f0f0;
              border-radius: 8px;
            }
            .related-table h3 {
              color: #0056b3;
              margin-bottom: 8px;
            }
            .back-button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 20px;
              background-color: #007bff;
              color: white;
              font-size: 16px;
              border-radius: 5px;
              text-decoration: none;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
            .back-button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="details-container">
            <h2>${table.name} - Row Details</h2>
            <div class="row-detail">
              <strong>ID:</strong> ${row[table.attributes[0]]}
            </div>
            ${Object.entries(row).map(
              ([key, value]) => `
                <div class="row-detail">
                  <strong>${key}:</strong> ${value}
                </div>
              `
            ).join("")}
            ${relatedTablesData.map((relatedTableData) => `
              <div class="related-table">
                <h3>Related Table: ${relatedTableData.table}</h3>
                <table>
                  <thead>
                    <tr>
                      ${Object.keys(relatedTableData.data[0] || {}).map(
                        (column) => `<th>${column}</th>`
                      ).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${relatedTableData.data.map((relatedRow) => `
                      <tr>
                        ${Object.values(relatedRow).map((value) => `
                          <td>${value}</td>
                        `).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
            <a href="#" class="back-button" onclick="window.history.back();">Back to Table</a>
          </div>
        </body>
      </html>
    `;

    const newTab = window.open();
    newTab.document.write(rowDetails);
    newTab.document.close();
  };

  return (
    <div className="table-container">
      <h1>{table.name} View</h1>
      <div className="filter-container">
        {table.attributes.map((attribute) => (
          <div key={attribute} className="filter-item">
            <label>{attribute}</label>
            <input
              type="text"
              name="value"
              value={filters[attribute].value || ""}
              onChange={(e) => handleFilterChange(e, attribute)}
              placeholder={`Filter by ${attribute}`}
            />
            <select
              name="operator"
              value={filters[attribute].operator || ""}
              onChange={(e) => handleFilterChange(e, attribute)}
            >
              <option value="">Select operator</option>
              <option value="gt">Greater than</option>
              <option value="lt">Less than</option>
              <option value="eq">Equal to</option>
              <option value="gte">Greater than or equal to</option>
              <option value="lte">Less than or equal to</option>
            </select>
          </div>
        ))}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <table>
          <thead>
            <tr>
              {table.attributes.map((attribute) => (
                <th
                  key={attribute}
                  onClick={() => requestSort(attribute)}
                  style={{ cursor: "pointer" }}
                >
                  {attribute}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[table.attributes[0]]}>
                {table.attributes.map((attribute) => (
                  <td key={attribute}>{row[attribute]}</td>
                ))}
                <td>
                  <button onClick={() => viewRowDetails(row)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TableView;
