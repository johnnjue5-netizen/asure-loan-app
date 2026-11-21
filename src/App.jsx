
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const addDays = (date, days) => {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const money = value => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES'
}).format(Number(value || 0));

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    nationalId: '',
    customerEmail: '',
    amount: '',
    weeks: '4',
    loanDate: today(),
    dueDate: addDays(today(), 7)
  });

  const interest = Number(form.amount || 0) * 0.009 *
    Number(form.weeks || 0) * 7;

  const total = Number(form.amount || 0) + interest;
  const installment = Number(form.weeks) > 0
    ? total / Number(form.weeks) : 0;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadLoans();
    } else {
      setLoans([]);
    }
  }, [session]);

  async function signIn(e) {
    e.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) setError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadLoans() {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('Loans')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      const { data: customers, error: customerError } =
        await supabase.from('Customers')
          .select('id, Full_name, Phone_number');

      if (customerError) throw customerError;

      const customerMap = Object.fromEntries(
        (customers || []).map(c => [c.id, c])
      );

      setLoans((data || []).map(loan => ({
        ...loan,
        customer: customerMap[loan.Customer_Id]
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addLoan(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.rpc(
        'create_loan_with_customer',
        {
          p_full_name: form.name,
          p_phone_number: form.phone,
          p_national_id: form.nationalId,
          p_email: form.customerEmail,
          p_loan_amount: Number(form.amount),
          p_repayment_weeks: Number(form.weeks),
          p_loan_date: form.loanDate,
          p_first_due_date: form.dueDate
        }
      );

      if (error) throw error;

      setMessage(`Loan number ${data} saved successfully!`);

      setForm({
        name: '',
        phone: '',
        nationalId: '',
        customerEmail: '',
        amount: '',
        weeks: '4',
        loanDate: today(),
        dueDate: addDays(today(), 7)
      });

      setShowForm(false);
      await loadLoans();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginTop: '5px',
    marginBottom: '14px',
    border: '1px solid #aab7c4',
    borderRadius: '6px',
    fontSize: '16px',
    color: '#111',
    background: '#fff',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '6px',
    background: '#075eab',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer'
  };

  if (!supabase) {
    return <main style={{padding: 25, color: '#111'}}>
      Supabase configuration is missing. Check your Netlify variables.
    </main>;
  }

  if (!session) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#edf3f8',
        display: 'grid',
        placeItems: 'center',
        padding: 20
      }}>
        <form onSubmit={signIn} style={{
          background: 'white',
          padding: 25,
          borderRadius: 12,
          width: '100%',
          maxWidth: 380,
          boxSizing: 'border-box',
          color: '#111'
        }}>
          <h1>Asure Enterprises</h1>
          <h3>Staff Login</h3>

          <label>Email address</label>
          <input style={inputStyle}
            type="email" required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input style={inputStyle}
            type="password" required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p style={{color: 'red'}}>{error}</p>}

          <button style={buttonStyle} type="submit">
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: 18,
      background: '#edf3f8',
      color: '#17212b',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        background: '#073763',
        color: 'white',
        padding: 20,
        borderRadius: 10
      }}>
        <h1>Asure Enterprises</h1>
        <h2>Loan Management Dashboard</h2>
        <p>Secure loan management system</p>
        <button onClick={signOut} style={{
          ...buttonStyle,
          background: '#a83232'
        }}>Sign out</button>
      </header>

      {message && <p style={{color: 'green'}}>{message}</p>}
      {error && <p style={{color: '#b00020'}}>{error}</p>}

      <section style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 20
      }}>
        <button style={buttonStyle}
          onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '+ Add New Loan'}
        </button>

        <button style={{
          ...buttonStyle,
          background: '#237447'
        }} onClick={loadLoans}>
          Refresh Loans
        </button>
      </section>

      {showForm && (
        <form onSubmit={addLoan} style={{
          background: 'white',
          padding: 20,
          borderRadius: 10,
          marginTop: 20,
          maxWidth: 650,
          boxSizing: 'border-box'
        }}>
          <h2>New Customer and Loan</h2>

          <label>Customer full name *</label>
          <input style={inputStyle} name="name"
            value={form.name} onChange={updateForm}
            required />

          <label>Phone number</label>
          <input style={inputStyle} name="phone"
            value={form.phone} onChange={updateForm}
            type="tel" />

          <label>National ID</label>
          <input style={inputStyle} name="nationalId"
            value={form.nationalId} onChange={updateForm} />

          <label>Email address</label>
          <input style={inputStyle} name="customerEmail"
            type="email" value={form.customerEmail}
            onChange={updateForm} />

          <label>Amount borrowed (KES) *</label>
          <input style={inputStyle} name="amount"
            type="number" min="1" step="0.01"
            value={form.amount} onChange={updateForm}
            required />

          <label>Repayment period (weeks) *</label>
          <input style={inputStyle} name="weeks"
            type="number" min="1" step="1"
            value={form.weeks} onChange={updateForm}
            required />

          <label>Loan date *</label>
          <input style={inputStyle} name="loanDate"
            type="date" value={form.loanDate}
            onChange={updateForm} required />

          <label>First repayment date *</label>
          <input style={inputStyle} name="dueDate"
            type="date" value={form.dueDate}
            onChange={updateForm} required />

          <section style={{
            background: '#eaf2fa',
            padding: 15,
            borderRadius: 8,
            marginBottom: 18
          }}>
            <h3>Loan Calculation</h3>
            <p>Daily interest: 0.9%</p>
            <p>Interest amount: <b>{money(interest)}</b></p>
            <p>Total repayment: <b>{money(total)}</b></p>
            <p>Weekly installment: <b>{money(installment)}</b></p>
          </section>

          <button style={buttonStyle}
            type="submit" disabled={saving}>
            {saving ? 'Saving Loan...' : 'Save New Loan'}
          </button>
        </form>
      )}

      <section style={{
        background: 'white',
        padding: 16,
        borderRadius: 10,
        marginTop: 22
      }}>
        <h2>Loan Records ({loans.length})</h2>

        {loading && <p>Loading loans...</p>}

        {!loading && loans.length === 0 &&
          <p>No loan records found yet.</p>}

        <div style={{overflowX: 'auto'}}>
          <table style={{
            width: '100%',
            minWidth: 750,
            borderCollapse: 'collapse',
            color: '#111'
          }}>
            <thead>
              <tr style={{background: '#dce9f5'}}>
                {['Loan ID','Customer','Amount','Interest',
                  'Total Repayment','Weekly Installment',
                  'Outstanding','Status'].map(item =>
                  <th key={item} style={{
                    padding: 12,
                    border: '1px solid #bdc9d5',
                    textAlign: 'left'
                  }}>{item}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {loan.id}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {loan.customer?.Full_name || 'Customer'}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {money(loan['Loan-amount'])}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {money(Number(loan['Total_repayment'] || 0) -
                      Number(loan['Loan-amount'] || 0))}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {money(loan['Total_repayment'])}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {money(loan['Weekly_installment'])}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {money(loan.outstanding_balance)}
                  </td>
                  <td style={{padding: 10, border: '1px solid #ddd'}}>
                    {loan.Status || 'Unpaid'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
