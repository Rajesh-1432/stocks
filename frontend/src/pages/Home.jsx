import React, { useEffect, useState } from 'react';
import api from '@/utils/api';

const OptionsAnalysis = () => {
  const [fyersData, setFyersData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fmt = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "-";
    return (Number(num) / 10000000).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const fmt1 = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "-";
    return Number(num).toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getColor = (value, stat) => {
    if (!stat || stat.max === stat.min) {
      return "white";
    }
    let ratio = (value - stat.min) / (stat.max - stat.min);
    let red = Math.round(255 * (1 - ratio));
    let green = Math.round(255 * ratio);
    let blue = 200;
    return `rgb(${red},${green},${blue})`;
  };

  const fetchFyersData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/get-fyers-data');
      const data = response.data?.data || response.data || [];
      // console.log('Fetched data count:', data.length);
      if (data.length > 0) {
        // console.log('Sample record:', data[0]);
      }
      setFyersData(data);
    } catch (error) {
      console.error('Error fetching fyers data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    if (!fyersData || fyersData.length === 0) {
      console.log('No data to process');
      return;
    }

    // console.log('Processing data...', fyersData.length, 'records');
    // console.log('First 3 records:', fyersData.slice(0, 3));
    const map = {};

    // Group by strike price
    fyersData.forEach((r, idx) => {
      const strike = (r["Strike Price"] || "").toString().trim();
      
      if (idx < 5) {
        // console.log(`Record ${idx}:`, {
        //   strike: r["Strike Price"],
        //   ltp: r["LTP"],
        //   volume: r["T.Volume"],
        //   avgPrice: r["Avg Price"],
        //   oi: r["OI"]
        // });
      }
      
      if (!strike) {
        console.log('Skipping record - no strike:', r);
        return;
      }

      const ltp = parseFloat(r["LTP"]) || 0;
      const tvol = parseFloat(r["T.Volume"]) || 0;
      const avgPrice = parseFloat(r["Avg Price"]) || 0;
      const oi = parseFloat(r["OI"]) || 0;

      const metrics = {
        ltp,
        ltpVol: ltp * tvol,
        avgVol: avgPrice * tvol,
        avgOi: ltp * oi,
      };

      if (!map[strike]) {
        map[strike] = [];
      }
      map[strike].push(metrics);
    });
    
    // console.log('Grouped strikes:', Object.keys(map).length);
    // console.log('First few strikes:', Object.keys(map).slice(0, 5));

    // For each strike, sort by LTP (higher = CE, lower = PE)
    const finalMap = {};
    Object.keys(map).forEach(strike => {
      const records = map[strike];
      
      // console.log(`Strike ${strike}: ${records.length} records, LTPs:`, records.map(r => r.ltp));
      
      if (records.length >= 2) {
        // Sort by LTP descending
        records.sort((a, b) => b.ltp - a.ltp);
        
        finalMap[strike] = {
          CE: records[0], // Higher LTP = Call
          PE: records[1]  // Lower LTP = Put
        };
      } else if (records.length === 1) {
        // If only one record, we can't determine CE/PE, skip this strike
        // console.log(`Skipping strike ${strike}: only one record`);
      }
    });

    const strikes = Object.keys(finalMap).sort((a, b) => parseFloat(a) - parseFloat(b));
    // console.log('Final processed strikes:', strikes.length);
    // console.log('Strikes:', strikes);

    if (strikes.length === 0) {
      // console.log('No valid strike pairs found');
      return;
    }

    const newStats = {
      sumLtpvol: { min: Infinity, max: -Infinity },
      diffLtpVol: { min: Infinity, max: -Infinity },
      sumAvgvol: { min: Infinity, max: -Infinity },
      diffAvgVol: { min: Infinity, max: -Infinity },
      avgratio: { min: Infinity, max: -Infinity },
      sumAvgOi: { min: Infinity, max: -Infinity },
      diffAvgOi: { min: Infinity, max: -Infinity }
    };

    const rowData = strikes.map((strike) => {
      const CE = finalMap[strike].CE || { ltpVol: 0, avgVol: 0, avgOi: 0 };
      const PE = finalMap[strike].PE || { ltpVol: 0, avgVol: 0, avgOi: 0 };

      const diffLtpVol = CE.ltpVol - PE.ltpVol;
      const diffAvgVol = CE.avgVol - PE.avgVol;
      const diffAvgOi = CE.avgOi - PE.avgOi;
      const sumLtpvol = CE.ltpVol + PE.ltpVol;
      const sumAvgvol = CE.avgVol + PE.avgVol;
      const sumAvgOi = CE.avgOi + PE.avgOi;
      const avgratio = diffAvgVol !== 0 ? Math.abs((sumAvgvol / diffAvgVol)/10) : 0;

      newStats.sumLtpvol.min = Math.min(newStats.sumLtpvol.min, sumLtpvol);
      newStats.sumLtpvol.max = Math.max(newStats.sumLtpvol.max, sumLtpvol);
      newStats.diffLtpVol.min = Math.min(newStats.diffLtpVol.min, diffLtpVol);
      newStats.diffLtpVol.max = Math.max(newStats.diffLtpVol.max, diffLtpVol);
      newStats.sumAvgvol.min = Math.min(newStats.sumAvgvol.min, sumAvgvol);
      newStats.sumAvgvol.max = Math.max(newStats.sumAvgvol.max, sumAvgvol);
      newStats.diffAvgVol.min = Math.min(newStats.diffAvgVol.min, diffAvgVol);
      newStats.diffAvgVol.max = Math.max(newStats.diffAvgVol.max, diffAvgVol);
      newStats.avgratio.min = Math.min(newStats.avgratio.min, avgratio);
      newStats.avgratio.max = Math.max(newStats.avgratio.max, avgratio);
      newStats.sumAvgOi.min = Math.min(newStats.sumAvgOi.min, sumAvgOi);
      newStats.sumAvgOi.max = Math.max(newStats.sumAvgOi.max, sumAvgOi);
      newStats.diffAvgOi.min = Math.min(newStats.diffAvgOi.min, diffAvgOi);
      newStats.diffAvgOi.max = Math.max(newStats.diffAvgOi.max, diffAvgOi);

      return { 
        strike, 
        diffLtpVol, 
        diffAvgVol, 
        diffAvgOi, 
        sumLtpvol, 
        sumAvgvol, 
        sumAvgOi, 
        avgratio 
      };
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

  const filteredData = processedData.filter(row => 
    row.strike.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const playAlertSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log('Could not play sound:', e));
  };

  useEffect(() => {
    fetchFyersData();
    const interval = setInterval(() => {
      fetchFyersData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fyersData.length > 0) {
      processData();
    }
  }, [fyersData]);

  useEffect(() => {
    const hasHighlight = processedData.some(r => 
      r.diffLtpVol < 0 && r.diffAvgVol > 0 && r.avgratio >= 0.1 && r.avgratio <= 1 && r.diffAvgOi > 0
    );
    
    if (hasHighlight) {
      playAlertSound();
      const firstHighlightIndex = processedData.findIndex(r => 
        r.diffLtpVol < 0 && r.diffAvgVol > 0 && r.avgratio >= 0.1 && r.avgratio <= 1 && r.diffAvgOi > 0
      );
      if (firstHighlightIndex !== -1) {
        setTimeout(() => {
          const rowElement = document.querySelector(`tr[data-index="${firstHighlightIndex}"]`);
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [processedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading options data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 bg-gray-50">
      <style>{`
        @keyframes blinker {
          50% { opacity: 0; }
        }
        .blink {
          animation: blinker 1s linear infinite;
        }
        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .table-container {
          max-height: 600px;
          overflow-y: auto;
          overflow-x: auto;
        }
        .options-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 11px;
        }
        .options-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #f4f4f4;
        }
        .options-table th {
          background: #f4f4f4;
          border: 1px solid #ccc;
          padding: 8px 6px;
          text-align: center;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          min-width: 80px;
        }
        .options-table th:hover {
          background: #e8e8e8;
        }
        .options-table td {
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          text-align: right;
          white-space: nowrap;
        }
        .options-table td:first-child {
          text-align: left;
          font-weight: 500;
        }
        .options-table tbody tr:hover {
          background: rgba(243, 244, 246, 0.5) !important;
        }
        @media (max-width: 768px) {
          .options-table {
            font-size: 10px;
          }
          .options-table th,
          .options-table td {
            padding: 4px;
            min-width: 70px;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Options Analysis</h2>
        
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input
            type="text"
            placeholder="Search strike..."
            className="p-2 w-full sm:w-64 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <div className="text-sm text-gray-600">
            Records: {fyersData.length} | Strikes: {processedData.length}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="table-wrapper">
            <div className="table-container">
              <table className="options-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort(0, 'strike')}>
                      Strike {sortConfig.key === 'strike' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(1, 'sumLtpvol')}>
                      LTP Sum<br/>(CE+PE) {sortConfig.key === 'sumLtpvol' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(2, 'diffLtpVol')}>
                      LTP Diff<br/>(CE-PE) {sortConfig.key === 'diffLtpVol' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(3, 'sumAvgvol')}>
                      Avg Sum<br/>(CE+PE) {sortConfig.key === 'sumAvgvol' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(4, 'diffAvgVol')}>
                      Avg Diff<br/>(CE-PE) {sortConfig.key === 'diffAvgVol' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(5, 'avgratio')}>
                      Avg Ratio<br/>(CE-PE) {sortConfig.key === 'avgratio' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(6, 'sumAvgOi')}>
                      LTP OI Sum<br/>(CE+PE) {sortConfig.key === 'sumAvgOi' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort(7, 'diffAvgOi')}>
                      LTP OI Diff<br/>(CE-PE) {sortConfig.key === 'diffAvgOi' && (sortConfig.ascending ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => {
                    const highlight = row.diffLtpVol < 0 && row.diffAvgVol > 0 && row.avgratio >= 0.1 && row.avgratio <= 1 && row.diffAvgOi > 0;
                    const maxLTP = stats && row.sumLtpvol === stats.sumLtpvol.max;
                    
                    return (
                      <tr 
                        key={`${row.strike}-${idx}`}
                        data-index={idx}
                        className={highlight ? 'blink' : ''}
                      >
                        <td>{row.strike}</td>
                        <td 
                          style={{ 
                            backgroundColor: stats ? getColor(row.sumLtpvol, stats.sumLtpvol) : 'white',
                            border: maxLTP ? '2px solid orange' : '1px solid #d1d5db'
                          }}
                        >
                          {fmt(row.sumLtpvol)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.diffLtpVol, stats.diffLtpVol) : 'white' }}>
                          {fmt(row.diffLtpVol)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.sumAvgvol, stats.sumAvgvol) : 'white' }}>
                          {fmt(row.sumAvgvol)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.diffAvgVol, stats.diffAvgVol) : 'white' }}>
                          {fmt(row.diffAvgVol)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.avgratio, stats.avgratio) : 'white' }}>
                          {fmt1(row.avgratio)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.sumAvgOi, stats.sumAvgOi) : 'white' }}>
                          {fmt(row.sumAvgOi)}
                        </td>
                        <td style={{ backgroundColor: stats ? getColor(row.diffAvgOi, stats.diffAvgOi) : 'white' }}>
                          {fmt(row.diffAvgOi)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {processedData.length === 0 && !loading && (
          <div className="text-center mt-8 text-gray-600">
            {fyersData.length === 0 ? 'No data available' : 'Processing data...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default OptionsAnalysis;