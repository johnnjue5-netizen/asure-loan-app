import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

export default function App() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadLoans() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setLoans(data || []);
      setError('');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  const money = value =>
    'KES ' + Number(value || 0).toLocaleString('en-KE');

  const total = loans.reduce(
    (sum, loan) => sum + Number(loan.loan_amount || loan['Loan-amount'] || 0), 0
  );

  const outstanding = loans.reduce(
    (sum, loan) => sum + Number(loan.outstanding_balance || 0), 0
  );

  const paid = loans.filter(
    loan => String(loan.status || '').toLowerCase() === 'paid'
  ).length;

  return (
    <main style={{
      background: '#f1f5f9',
      minHeight: '100vh',
      padding: '20px',
      color: '#102a43',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>ASURE ENTERPRISES</h1>
      <h2>Loan Management Dashboard</h2>
      <p>Manage customers, loans and repayments.</p>

      <button onClick={loadLoans} style={{
        padding: '10px 18px',
        background: '#102a43',
        color: 'white',
        border: 0,
        borderRadius: '6px'
      }}>
        Refresh Dashboard
      </button>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
        gap: '15px',
        marginTop: '25px'
      }}>
        {[
          ['Total Loans', loans.length],
          ['Loan Amount', money(total)],
          ['Outstanding', money(outstanding)],
          ['Paid Loans', paid]
        ].map(([label, value]) => (
          <div key={label} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px #0001'
          }}>
            <p style={{ color: '#52677d' }}>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </section>

      <h2 style={{ marginTop: '30px' }}>Loan Records</h2>

      {loading && <p>Loading loan records...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ overflowX: 'auto', background: 'white' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#102a43',
          background: 'white'
        }}>
          <thead style={{ background: '#102a43', color: 'white' }}>
            <tr>
              {['Loan ID', 'Customer ID', 'Amount', 'Repaid',
                'Outstanding', 'Status'].map(item => (
                <th key={item} style={{ padding: '12px' }}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id}>
                <td style={{ padding: '12px' }}>{loan.id}</td>
                <td style={{ padding: '12px' }}>{loan.customer_id}</td>
                <td style={{ padding: '12px' }}>
                  {money(loan.loan_amount || loan['Loan-amount'])}
                </td>
                <td style={{ padding: '12px' }}>
                  {money(loan.total_repaid)}
                </td>
                <td style={{ padding: '12px' }}>
                  {money(loan.outstanding_balance)}
                </td>
                <td style={{ padding: '12px' }}>{loan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !error && loans.length === 0 && (
        <p>No loan records found yet.</p>
      )}
    </main>
  );
}
