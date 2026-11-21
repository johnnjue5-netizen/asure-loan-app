
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

export default function App() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadLoans() {
    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  return (
    <main style={{
      padding: '20px',
      background: '#ffffff',
      color: '#111111',
      minHeight: '100vh'
    }}>
      <h1>Asure Enterprises</h1>
      <h2>Loan Management Dashboard</h2>

      <button onClick={loadLoans}>Refresh Loans</button>

      {loading && <p>Loading loans...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <h3>Loan Records ({loans.length})</h3>

          {loans.length === 0 ? (
            <p>No loan records found yet.</p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: '#111111'
              }}>
                <thead>
                  <tr>
                    {Object.keys(loans[0]).map(key => (
                      <th key={key} style={{
                        padding: '12px',
                        border: '1px solid #cccccc',
                        background: '#e8f0f8'
                      }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr key={loan.id || index}>
                      {Object.values(loan).map((value, i) => (
                        <td key={i} style={{
                          padding: '12px',
                          border: '1px solid #cccccc',
                          color: '#111111'
                        }}>
                          {String(value ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
