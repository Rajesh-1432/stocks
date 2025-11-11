import React, { useEffect, useState } from "react";
import api from "@/utils/api";

const OptionsAnalysis = () => {
  const [fyersData, setFyersData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fmt = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "-";
    return (Number(num) / 10000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fmt1 = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "-";
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getColor = (value, stat) => {
    if (!stat || stat.max === stat.min) return "white";
    let ratio = (value - stat.min) / (stat.max - stat.min);
    let red = Math.round(255 * (1 - ratio));
    let green = Math.round(255 * ratio);
    let blue = 200;
    return `rgb(${red},${green},${blue})`;
  };

  const fetchFyersData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/auth/get-fyers-data");
      const data = response.data?.data || response.data || [];
      setFyersData(data);
    } catch (error) {
      console.error("Error fetching fyers data:", error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED PROCESS LOGIC (Auto Detect CE/PE by LTP — Works for live API & CSV)
  const processData = () => {
    if (!fyersData || fyersData.length === 0) return;

    const strikeGroups = {};

    fyersData.forEach((r) => {
      const strike = (r["Strike Price"] || "").toString().trim();
      if (!strike) return;

      const ltp = parseFloat(r["LTP"]) || 0;
      const tvol = parseFloat(r["T.Volume"]) || 0;
      const avgPrice = parseFloat(r["Avg Price"]) || 0;
      const oi = parseFloat(r["OI"]) || 0;

      const metrics = {
        ltpVol: ltp * tvol,
        avgVol: avgPrice * tvol,
        avgOi: ltp * oi,
        ltp,
        vol: tvol,
      };

      if (!strikeGroups[strike]) strikeGroups[strike] = [];
      strikeGroups[strike].push(metrics);
    });

    // ✅ Sort each strike by LTP → Highest = CE, 2nd = PE
    const map = {};
    Object.keys(strikeGroups).forEach((strike) => {
      const sorted = strikeGroups[strike].sort((a, b) => b.ltp - a.ltp);
      map[strike] = {
        CE: sorted[0] || { ltpVol: 0, avgVol: 0, avgOi: 0, vol: 0 },
        PE: sorted[1] || { ltpVol: 0, avgVol: 0, avgOi: 0, vol: 0 },
      };
    });

    const strikes = Object.keys(map).sort(
      (a, b) => parseFloat(a) - parseFloat(b)
    );

    const newStats = {
      sumLtpvol: { min: Infinity, max: -Infinity },
      diffLtpVol: { min: Infinity, max: -Infinity },
      sumAvgvol: { min: Infinity, max: -Infinity },
      diffAvgVol: { min: Infinity, max: -Infinity },
      avgratio: { min: Infinity, max: -Infinity },
      sumAvgOi: { min: Infinity, max: -Infinity },
      diffAvgOi: { min: Infinity, max: -Infinity },
      diffltpavg: { min: Infinity, max: -Infinity },
      vwapSum: { min: Infinity, max: -Infinity },
      vwapDiff: { min: Infinity, max: -Infinity },
    };

    const rowData = strikes.map((strike) => {
      const CE = map[strike].CE;
      const PE = map[strike].PE;

      const diffLtpVol = CE.ltpVol - PE.ltpVol;
      const diffAvgVol = CE.avgVol - PE.avgVol;
      const diffAvgOi = CE.avgOi - PE.avgOi;
      const sumLtpvol = CE.ltpVol + PE.ltpVol;
      const sumAvgvol = CE.avgVol + PE.avgVol;
      const sumAvgOi = CE.avgOi + PE.avgOi;
      const diffltpavg = diffLtpVol - diffAvgVol;
      const avgratio =
        diffAvgVol !== 0 ? Math.abs(sumAvgvol / diffAvgVol / 10) : 0;

      const ceVWAP = CE.vol ? CE.ltpVol / CE.vol : 0;
      const peVWAP = PE.vol ? PE.ltpVol / PE.vol : 0;
      const vwapDiff = ceVWAP - peVWAP;
      const vwapSum = ceVWAP + peVWAP;

      const row = {
        strike,
        diffLtpVol,
        diffAvgVol,
        diffAvgOi,
        sumLtpvol,
        sumAvgvol,
        sumAvgOi,
        avgratio,
        diffltpavg,
        vwapDiff,
        vwapSum,
      };

      Object.keys(newStats).forEach((key) => {
        newStats[key].min = Math.min(newStats[key].min, row[key]);
        newStats[key].max = Math.max(newStats[key].max, row[key]);
      });

      return row;
    });

    setStats(newStats);
    setProcessedData(rowData);
  };

  const handleSort = (columnIndex, key) => {
    const ascending = sortConfig.key === key ? !sortConfig.ascending : true;
    setSortConfig({ key, ascending });

    const sorted = [...processedData].sort((a, b) => {
      const aVal = parseFloat(a[key]) || 0;
      const bVal = parseFloat(b[key]) || 0;
      return ascending ? aVal - bVal : bVal - aVal;
    });

    setProcessedData(sorted);
  };

  const filteredData = processedData.filter((row) =>
    row.strike.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const playAlertSound = () => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    audio.play().catch(() => {});
  };

  useEffect(() => {
    fetchFyersData();
    const interval = setInterval(fetchFyersData, 10000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const row = document.getElementById("highlight-row");
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [processedData]);

  useEffect(() => {
    if (fyersData.length > 0) processData();
  }, [fyersData]);

  useEffect(() => {
    const hasSignal = processedData.some(
      (r) =>
        r.diffLtpVol < 0 &&
        r.diffAvgVol > 0 &&
        r.avgratio >= 0.1 &&
        r.avgratio <= 1 &&
        r.diffAvgOi > 0
    );
    if (hasSignal) playAlertSound();
  }, [processedData]);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-600">{error}</div>;

  return (
    <div className="h-full p-4 bg-gray-50">
      <style>{`
      .table-container {
        max-height: calc(100vh - 220px); /* ✅ Adjust height to fit screen */
        overflow-y: auto;
        overflow-x: auto;
        border: 1px solid #d1d5db;
        border-radius: 6px;
      }

      .options-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        min-width: 900px; /* ✅ prevent squish */
      }

      .options-table thead th {
        position: sticky;
        top: 0;
        background: #f3f4f6;
        z-index: 10;
        padding: 6px;
        border-bottom: 1px solid #d1d5db;
        cursor: pointer;
        white-space: nowrap;
      }

      .options-table tbody td {
        padding: 6px 8px;
        border-bottom: 1px solid #e5e7eb;
        text-align: right;
        white-space: nowrap;
      }

      .options-table tbody tr:hover {
        background-color: rgba(243, 244, 246, 0.5);
      }

      .blink {
        animation: blinkAnim 1s linear infinite;
      }
      @keyframes blinkAnim {
        50% { opacity: 0; }
      }
    `}</style>

      <input
        type="text"
        placeholder="Search strike..."
        className="p-2 mb-3 border border-gray-300 rounded w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
      />

      <div className="table-container">
        <table className="options-table">
          <thead>
            <tr>
              <th onClick={() => handleSort(0, "strike")}>Strike</th>
              <th onClick={() => handleSort(1, "sumLtpvol")}>LTP Sum</th>
              <th onClick={() => handleSort(2, "diffLtpVol")}>LTP Diff</th>
              <th onClick={() => handleSort(3, "sumAvgvol")}>Avg Sum</th>
              <th onClick={() => handleSort(4, "diffAvgVol")}>Avg Diff</th>
              <th onClick={() => handleSort(5, "avgratio")}>Avg Ratio</th>
              <th onClick={() => handleSort(6, "sumAvgOi")}>LTP OI Sum</th>
              <th onClick={() => handleSort(7, "diffAvgOi")}>LTP OI Diff</th>
              <th onClick={() => handleSort(8, "diffltpavg")}>LTP Avg Diff</th>
              <th onClick={() => handleSort(9, "vwapSum")}>VWAP Sum</th>
              <th onClick={() => handleSort(10, "vwapDiff")}>VWAP Diff</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row, idx) => {
              const highlight =
                row.diffLtpVol < 0 &&
                row.diffAvgVol > 0 &&
                row.avgratio >= 0.1 &&
                row.avgratio <= 1 &&
                row.diffAvgOi > 0;

              return (
                <tr
                  key={idx}
                  className={highlight ? "blink" : ""}
                  id={highlight ? "highlight-row" : undefined}
                >
                  <td style={{ textAlign: "left" }}>{row.strike}</td>
                  <td
                    style={{
                      background: getColor(row.sumLtpvol, stats.sumLtpvol),
                    }}
                  >
                    {fmt(row.sumLtpvol)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.diffLtpVol, stats.diffLtpVol),
                    }}
                  >
                    {fmt(row.diffLtpVol)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.sumAvgvol, stats.sumAvgvol),
                    }}
                  >
                    {fmt(row.sumAvgvol)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.diffAvgVol, stats.diffAvgVol),
                    }}
                  >
                    {fmt(row.diffAvgVol)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.avgratio, stats.avgratio),
                    }}
                  >
                    {fmt1(row.avgratio)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.sumAvgOi, stats.sumAvgOi),
                    }}
                  >
                    {fmt(row.sumAvgOi)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.diffAvgOi, stats.diffAvgOi),
                    }}
                  >
                    {fmt(row.diffAvgOi)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.diffltpavg, stats.diffltpavg),
                    }}
                  >
                    {fmt(row.diffltpavg)}
                  </td>
                  <td
                    style={{ background: getColor(row.vwapSum, stats.vwapSum) }}
                  >
                    {fmt1(row.vwapSum)}
                  </td>
                  <td
                    style={{
                      background: getColor(row.vwapDiff, stats.vwapDiff),
                    }}
                  >
                    {fmt1(row.vwapDiff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsAnalysis;
