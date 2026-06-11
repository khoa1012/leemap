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
  const [activeNatures, setActiveNatures] = useState([]); // null = all types shown
  const [selectedNatures, setSelectedNatures] = useState([]);
  const [incCount, setIncCount] = useState(0);
  const [incidentsByLocations, setIncidentsByLocations] = useState([]);
  const [incidentsByDays, setIncidentsByDays] = useState([]);
  const [incidentsByTypes, setIncidentsByTypes] = useState([]);
  const [finalList, setFinalList] = useState([]);

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [typePop, setTypePop] = useState(false);
  const [allType, setAllType] = useState(true);
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
        const natures = [
          ...new Set(incidentList.map((inc) => inc.nature || "Unknown")),
        ].sort();
        setActiveNatures(natures);
        setSelectedNatures(natures);
        console.log(natures);
        console.log(filtered);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);
  useEffect(() => {
    const filteredByDay = handleDays(incidentsByLocations, daysAgo);
    const filterByNature = handleNature(filteredByDay, selectedNatures);
    console.log(filterByNature);
    setIncCount(filterByNature.length);
    setFinalList(filterByNature);
  }, [incidentsByLocations, daysAgo, selectedNatures]);

  useEffect(() => {
    selectedNatures.length !== activeNatures.length
      ? setAllType(false)
      : setAllType(true);
  }, [selectedNatures]);
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
  function handleNature(incidentsByDays, selectedNatures) {
    return incidentsByDays.filter((inc) =>
      selectedNatures.includes(inc.nature),
    );
  }
  function toggleNature(checkNature) {
    setSelectedNatures((nature) =>
      nature.includes(checkNature)
        ? nature.filter((item) => item !== checkNature)
        : [...nature, checkNature],
    );
  }
  function onNatureChange(nature) {
    toggleNature(nature);
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
            <button onClick={() => setTypePop(!typePop)} className={allType === true?"nature-filter-btn":"nature-filter-btn nature-types"}>
              {allType
                ? "All types ▾"
                : selectedNatures.length !== 0
                  ? `${selectedNatures.length} types ▾`
                  : "No type ▾"}
            </button>
            <div className={typePop === false ? "hidden" : "nature-panel"}>
              <label
                className="nature-row"
                style={{ borderBottom: "1px solid #333" }}
              >
                <input
                  type="checkbox"
                  checked={selectedNatures.length === activeNatures.length}
                  onChange={() => {
                    allType === true
                      ? setSelectedNatures([])
                      : setSelectedNatures(activeNatures);
                    setAllType(!allType);
                  }}
                />
                ALL TYPE
              </label>
              {activeNatures
                ? activeNatures.map((nature, index) => {
                    return (
                      <label key={nature} className="nature-row">
                        <input
                          type="checkbox"
                          value={nature}
                          checked={selectedNatures.includes(nature)}
                          onChange={() => onNatureChange(nature)}
                        />
                        <span className="nature-dot"></span>
                        {nature}
                      </label>
                    );
                  })
                : ""}
            </div>
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
