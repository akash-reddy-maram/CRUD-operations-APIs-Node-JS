const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1
app.get("/states/", async (request, response) => {
  const getAllStatesDetailsQuery = `SELECT * FROM state ORDER BY state_id;`;
  const allStatesDetails = await db.all(getAllStatesDetailsQuery);
  let responseArr = allStatesDetails.map((eachObj) => {
    return {
      stateId: eachObj.state_id,
      stateName: eachObj.state_name,
      population: eachObj.population,
    };
  });
  response.send(responseArr);
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSelectedState = `SELECT * FROM state WHERE state_id=${stateId};`;
  const selectedStateResponse = await db.get(getSelectedState);
  response.send({
    stateId: selectedStateResponse.state_id,
    stateName: selectedStateResponse.state_name,
    population: selectedStateResponse.population,
  });
});

// API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES 
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const addDistrict = await db.run(addDistrictQuery);
  const districtId = addDistrict.lastID;
  response.send("District Successfully Added");
  console.log(districtId);
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const selectDistrictByIdQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const selectedDistrict = await db.get(selectDistrictByIdQuery);
  response.send({
    districtId: selectedDistrict.district_id,
    districtName: selectedDistrict.district_name,
    stateId: selectedDistrict.state_id,
    cases: selectedDistrict.cases,
    cured: selectedDistrict.cured,
    active: selectedDistrict.active,
    deaths: selectedDistrict.deaths,
  });
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId}`;
  db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE district SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateStatsQuery = `SELECT 
    sum(cases) AS totalCases,
    sum(cured) AS totalCured,
    sum(active) AS totalActive,
    sum(deaths) AS totalDeaths
    FROM district
    WHERE
    state_id=${stateId};
    `;
  const selectedStateStats = await db.get(stateStatsQuery);
  response.send(selectedStateStats);
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `SELECT state.state_name AS stateName FROM state INNER JOIN district ON state.state_id = district.state_id
    WHERE district_id=${districtId};`;
  const stateNameObj = await db.get(stateNameQuery);
  response.send(stateNameObj);
});

module.exports = app;
