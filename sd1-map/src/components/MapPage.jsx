import { useEffect, useState } from "react";
import "./MapPage.css";
import Map from "./Map";

function MapPage() {
  // ── Constants ──────────────────────────────────────────────────────────────

  const LEE_COUNTY_CENTER = [26.56, -81.87];
  const DEFAULT_ZOOM = 11;

  // Color palette keyed by incident nature (first word, lowercase)
  const NATURE_COLORS = {
    disturbance: "#e74c3c",
    assault: "#c0392b",
    theft: "#e67e22",
    burglary: "#d35400",
    traffic: "#3498db",
    suspicious: "#9b59b6",
    medical: "#1abc9c",
    fire: "#e74c3c",
    welfare: "#27ae60",
    domestic: "#c0392b",
    default: "#7f8c8d",
  };

  const API_BASE_URL = "http://localhost:5001";
  // ── State ──────────────────────────────────────────────────────────────────
  const [daysAgo, setDaysAgo] = useState(3);

  const [allIncidents, setAllIncidents] = useState([]);
  const [markerLayer, setMarkerLayer] = useState(null);
  const [activeNatures, setActiveNatures] = useState(null); // null = all types shown
  const [incCount, setIncCount] = useState(0);
  const [incidentsByLocations, setIncidentsByLocations] = useState([]);
  const [incidentsByDays, setIncidentsByDays] = useState([]);
  const [incidentsByTypes, setIncidentsByTypes] = useState([]);
  const [finalList, setFinalList] = useState([]);
  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        console.log("await....");
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const incidentList = await res.json();
        setAllIncidents(incidentList);
        //should have popup complete ***********************
        console.log("fetched successfully");
        console.log(incidentList);
        setIncidentsByLocations(
          incidentList.filter(
            (incident) => incident.lat != null && incident.lng != null,
          ),
        );
        const filtered = incidentList.filter(
          (incident) => incident.lat != null && incident.lng != null,
        );

        console.log(filtered);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);
  useEffect(() => {
    const filteredByDay = handleDays(incidentsByLocations, daysAgo);
    const filterByNature = handleNature(filteredByDay);
    console.log(filterByNature);
    setIncCount(filterByNature.length);
    setFinalList(filterByNature);
  }, [incidentsByLocations, daysAgo]);

  function handleDays(incidents, daysAgo) {
    const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    return incidents.filter((inc) => {
      if (!inc.occuredDate) return false;
      // Normalize to ISO 8601 for Safari: replace space, truncate to 3 decimal places
      const normalized = inc.occuredDate
        .replace(" ", "T")
        .replace(/(\.\d{3})\d+/, "$1");
      return new Date(normalized).getTime() >= cutoff;
    });
  }
  function handleNature(incidentsByDays) {
    return incidentsByDays.filter((incident) => incident.nature !== null);
  }
  return (
    <>
      <header id="top-bar">
        <div id="branding">
          <span id="title">Lee County Incident Map</span>
          <span id="subtitle">
            Lee County Sheriff's Office — last 1,000 incidents (48hr delay)
          </span>
        </div>
        <div id="controls">
          <label htmlFor="date-filter">Show incidents from:</label>
          <select
            id="date-filter"
            onChange={(e) => setDaysAgo(Number(e.target.value))}
          >
            <option value="3">3 Days Ago</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            {/* <option value="0">All available</option>  */}
          </select>
          <span id="count-badge">
            {incCount !== 0 ? incCount : "-"} incidents
          </span>
          <div id="nature-filter-wrap">
            <button id="nature-filter-btn">All types ▾</button>
            <div id="nature-panel" className="hidden"></div>
          </div>
        </div>
      </header>

      <div className="mapWrapper">
        <Map finalList={finalList} countyCenter={LEE_COUNTY_CENTER} />
      </div>

      <footer id="footer-bar">
        Created by:{" "}
        <a
          href="https://www.linkedin.com/in/andrew-kelton"
          target="_blank"
          rel="noopener"
        >
          Andrew Kelton
        </a>
        &nbsp;&middot;&nbsp;
        <a
          href="https://github.com/AndrewKelton/fort-myers-crime-map"
          target="_blank"
          rel="noopener"
        >
          View on GitHub
        </a>
      </footer>

      {/* <div id="loading-overlay">
        <div id="loading-box">
          <div className="spinner"></div>
          <p id="loading-msg">Loading incidents…</p>
        </div>
      </div> */}
    </>
  );
}

export default MapPage;
