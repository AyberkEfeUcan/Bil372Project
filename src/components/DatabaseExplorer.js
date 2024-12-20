import React, { useState, useEffect } from "react";
import TableView from "./TableView";

// Function to fetch table data from Flask API
async function fetchTableData(tableName) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/table/${tableName}`);
    if (!response.ok) {
      throw new Error("Table not found");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// Table definitions
const tables = [
  {
    name: "city",
    attributes: ["CityID", "CityName", "Population", "Region"],
    relations: ["powersource", "cityenergyusage", "energyproject", "environmentaldata", "citygoal"],
    data: [],
  },
  {
    name: "powersource",
    attributes: ["PowerSourceID", "SourceType", "Capacity", "CityID"],
    relations: ["city", "maintenancerecord", "supplier", "powersourceperformance"],
    data: [],
  },
  {
    name: "cityenergyusage",
    attributes: ["UsageID", "CityID", "Year", "TotalUsage", "RenewableUsage", "NonRenewableUsage"],
    relations: ["city"],
    data: [],
  },
  {
    name: "energyproject",
    attributes: ["ProjectID", "CityID", "ProjectName", "StartDate", "EndDate"],
    relations: ["city", "supplier"],
    data: [],
  },
  {
    name: "environmentaldata",
    attributes: ["DataID", "CityID", "Year", "CO2Emissions", "AirQualityIndex"],
    relations: ["city"],
    data: [],
  },
  {
    name: "supplier",
    attributes: ["SupplierID", "Name", "EnergyProjectID", "PowerSourceID", "Type"],
    relations: ["energyproject", "powersource"],
    data: [],
  },
  {
    name: "maintenancerecord",
    attributes: ["MaintenanceID", "PowerSourceID", "Date", "Type", "Cost"],
    relations: ["powersource"],
    data: [],
  },
  {
    name: "citygoal",
    attributes: ["GoalID", "CityID", "Description", "TargetDate", "State", "StateUpdateDate"],
    relations: ["city"],
    data: [],
  },
  {
    name: "powersourceperformance",
    attributes: ["PerformanceID","PowerSourceID", "WorkDuration", "Efficiency", "OverallCost"],
    relations: ["powersource"],
    data: [],
  },
];

function DatabaseExplorer() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for better UX

  // Function to handle table click
  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setLoading(true); // Show loading indicator
    try {
      // Fetch data for the selected table
      const data = await fetchTableData(table.name);
      setTableData(data);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableData([]);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Energy Database Explorer</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tables.map((table) => (
          <li key={table.name} style={{ marginBottom: "20px" }}>
            <div
              onClick={() => handleTableClick(table)}
              style={{
                cursor: "pointer",
                fontWeight: "bold",
                backgroundColor: "#f0f0f0",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              {table.name}
            </div>
          </li>
        ))}
      </ul>

      {selectedTable && (
        <div>
          <button
            onClick={() => {
              setSelectedTable(null);
              setTableData(null);
            }}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#fff",
              background: "linear-gradient(to right, #4facfe, #00f2fe)",
              border: "none",
              borderRadius: "20px",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            Back to Tables
          </button>
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <TableView table={selectedTable} data={tableData} />
          )}
        </div>
      )}
    </div>
  );
}

export default DatabaseExplorer;