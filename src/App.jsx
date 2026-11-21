
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

const RATE = 0.009;

export default function App() {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    id_number: ''
  });

  const money = value =>
    'KES ' + Number(value || 0).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  async function loadData() {
    setLoading(true);
    setError('');

    const [loanResult, customerResult] = await Promise.all([
      supabase.from('loans').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*')
    ]);

    if (loanResult.error) {
      setError(loanResult.error.message);
    } else {
      setLoans(loanResult.data || []);
    }

    if (!customerResult.error) {
      setCustomers(customerResult.data || []);
    } else {
      setError(prev => prev
        ? prev + ' | Customers: ' + customerResult.error.message
        : 'Customers: ' + customerResult.error.message
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addCustomer(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('customers')
      .insert([{
        name: form.name.trim(),
        phone: form.phone.trim(),
        id_number: form.id_number.trim()
      }]);

    if (error) {
      setMessage('Could not save customer: ' + error.message);
    } else {
      setMessage('Customer saved successfully!');
      setForm({ name: '', phone: '', id_number: '' });
      await loadData();
    }

    setSaving(false);
  }

  const total = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.loan_amount || loan['Loan-amount'] || 0), 0
  );

  const outstanding = loans.reduce(
    (sum, loan) => sum + Number(loan.outstanding_balance || 0), 0
  );

  const paid = loans.filter(
    loan => String(loan.status || '').toLowerCase() === 'paid'
  ).length;

  function interestDetails(loan) {
    const principal = Number(
      loan.loan_amount || loan['Loan-amount'] || 0
    );

    const start = loan.loan_date
      ? new Date(loan.loan_date)
      : new Date();

    const days = Math.max(
      0,
      Math.floor((new Date() - start) / 86400000)
    );

    const interest = principal * RATE * days;
    const totalDue = principal + interest;
    const repaid = Number(loan.total_repaid || 0);

    return {
      days,
      interest,
      totalDue,
      balance: Math.max(0, totalDue - repaid)
    };
  }

  return (
    <main style={{
      background: '#eef3f8',
      minHeight: '100vh',
      padding: '20px',
      color: '#102a43',
      fontFamily: 'Arial, sans-serif'
    }}>

      <h1>ASURE ENTERPRISES</h1>
      <h2>Loan Management Dashboard</h2>
      <p>Customer management, loans and daily interest.</p>

      <button onClick={loadData} style={buttonStyle}>
        Refresh Dashboard
      </button>

      {error && (
        <p style={{ color: '#b91c1c', fontWeight: 'bold' }}>
          {error}
        </p>
      )}

      <section style={gridStyle}>
        {[
          ['Total Loans', loans.length],
          ['Customers', customers.length],
          ['Loan Amount', money(total)],
          ['Outstanding', money(outstanding)],
          ['Paid Loans', paid]
        ].map(([label, value]) => (
          <div key={label} style={cardStyle}>
            <p>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </section>

      <section style={sectionStyle}>
        <h2>Add New Customer</h2>

        <form onSubmit={addCustomer}>
          <label>Customer Full Name</label>
          <input
            required
            value={form.name}
            onChange={e => setForm({
              ...form, name: e.target.value
            })}
            placeholder="Enter full name"
            style={inputStyle}
          />

          <label>Phone Number</label>
          <input
            required
            value={form.phone}
            onChange={e => setForm({
              ...form, phone: e.target.value
            })}
            placeholder="Enter phone number"
            style={inputStyle}
          />

          <label>National ID Number</label>
          <input
            required
            value={form.id_number}
            onChange={e => setForm({
              ...form, id_number: e.target.value
            })}
            placeholder="Enter ID number"
            style={inputStyle}
          />

          <button disabled={saving} type="submit" style={buttonStyle}>
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </form>

        {message && <p>{message}</p>}
      </section>

      <section style={sectionStyle}>
        <h2>Customer Records</h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Customer ID', 'Name', 'Phone', 'National ID'].map(x =>
                  <th style={headStyle} key={x}>{x}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td style={cellStyle}>{customer.id}</td>
                  <td style={cellStyle}>
                    {customer.name || customer.full_name}
                  </td>
                  <td style={cellStyle}>{customer.phone}</td>
                  <td style={cellStyle}>{customer.id_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Daily Interest Rate Table</h2>
        <h3>Daily Interest: 0.9%</h3>
        <p>Interest = Principal × 0.009 × elapsed days.</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Loan ID', 'Principal', 'Days', 'Interest', 'Total Due', 'Balance'].map(x =>
                  <th style={headStyle} key={x}>{x}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const result = interestDetails(loan);
                return (
                  <tr key={loan.id}>
                    <td style={cellStyle}>{loan.id}</td>
                    <td style={cellStyle}>
                      {money(loan.loan_amount || loan['Loan-amount'])}
                    </td>
                    <td style={cellStyle}>{result.days}</td>
                    <td style={cellStyle}>{money(result.interest)}</td>
                    <td style={cellStyle}>{money(result.totalDue)}</td>
                    <td style={cellStyle}>{money(result.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Loan Records</h2>

        {loading && <p>Loading records...</p>}

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Loan ID', 'Customer ID', 'Amount', 'Repaid', 'Outstanding', 'Status'].map(x =>
                  <th style={headStyle} key={x}>{x}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td style={cellStyle}>{loan.id}</td>
                  <td style={cellStyle}>{loan.customer_id}</td>
                  <td style={cellStyle}>
                    {money(loan.loan_amount || loan['Loan-amount'])}
                  </td>
                  <td style={cellStyle}>{money(loan.total_repaid)}</td>
                  <td style={cellStyle}>{money(loan.outstanding_balance)}</td>
                  <td style={cellStyle}>{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}

const buttonStyle = {
  padding: '12px 20px',
  background: '#075985',
  color: 'white',
  border: 0,
  borderRadius: '6px',
  cursor: 'pointer',
  margin: '10px 0'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
  gap: '15px',
  margin: '25px 0'
};

const cardStyle = {
  background: 'white',
  padding: '18px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px #0002',
  color: '#102a43'
};

const sectionStyle = {
  background: 'white',
  padding: '20px',
  marginTop: '25px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px #0001'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px',
  margin: '8px 0 18px',
  border: '1px solid #94a3b8',
  borderRadius: '6px',
  color: '#102a43',
  background: 'white',
  fontSize: '16px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'white',
  color: '#102a43'
};

const headStyle = {
  padding: '13px',
  background: '#102a43',
  color: 'white',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '13px',
  borderBottom: '1px solid #cbd5e1',
  color: '#102a43',
  fontWeight: '500',
  whiteSpace: 'nowrap'
};
