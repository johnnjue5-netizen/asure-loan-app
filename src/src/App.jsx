here
import React, { useEffect, useMemo, useState } from 'react';
import { supabase, configured } from './supabase';
import {
  Landmark, Users, Wallet, RefreshCw,
  AlertCircle, Search, ShieldCheck
} from 'lucide-react';

const money = v => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', maximumFractionDigits: 0
}).format(Number(v) || 0);

const pick = (row, keys) => {
  for (const k of keys) if (row?.[k] != null) return row[k];
  return null;
};

function App() {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Loans');
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(false);

  async function load() {
    if (!configured) {
      setError('Supabase connection details have not been added to Netlify yet.');
      return;
    }
    setLoading(true);
    setError('');

    const [l, c, r] = await Promise.all([
      supabase.from('Loans').select('*').limit(500),
      supabase.from('Customers').select('*').limit(500),
      supabase.from('Repayments').select('*').limit(500)
    ]);

    const firstError = l.error || c.error || r.error;
    if (firstError) {
      setError(firstError.message);
      setConnected(false);
    } else {
      setLoans(l.data || []);
      setCustomers(c.data || []);
      setRepayments(r.data || []);
      setConnected(true);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const outstanding = loans.reduce(
    (s, x) => s + (Number(pick(x, ['outstanding_balance', 'balance'])) || 0), 0
  );
  const paid = loans.filter(
    x => String(x.status || '').toLowerCase() === 'paid'
  ).length;

  const filtered = useMemo(() => {
    const rows = tab === 'Loans' ? loans :
      tab === 'Customers' ? customers : repayments;
    const q = search.toLowerCase();
    return rows.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  }, [tab, loans, customers, repayments, search]);

  const cols = filtered.length ? Object.keys(filtered[0]) : [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandmark"><Landmark size={23} /></div>
          <div><b>ASURE</b><small>ENTERPRISES</small></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        {['Overview', 'Loans', 'Customers', 'Repayments'].map(x => (
          <button key={x}
            className={'nav ' + ((tab === x || x === 'Overview' && tab === 'Loans') ? 'active' : '')}
            onClick={() => setTab(x === 'Overview' ? 'Loans' : x)}>
            {x === 'Loans' ? <Wallet /> :
              x === 'Customers' ? <Users /> :
              x === 'Repayments' ? <RefreshCw /> : <Landmark />}
            {x}
          </button>
        ))}
        <div className="side-foot">
          <ShieldCheck size={16} /> Secure staff access
          <br /><small>Access policies are controlled by Supabase.</small>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <div className="eyebrow">LOAN MANAGEMENT</div>
            <h1>{tab === 'Loans' ? 'Portfolio overview' : tab}</h1>
            <p className="sub">Manage customers, loans and repayments in one place.</p>
          </div>
          <button className="refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {!configured && (
          <div className="notice">
            <AlertCircle />
            Add the Supabase URL and publishable key as Netlify environment variables.
          </div>
        )}

        {error && <div className="notice error"><AlertCircle /> {error}</div>}

        <section className="stats">
          <div className="stat">
            <span>Total loans</span><strong>{loans.length}</strong>
            <small>Loan records</small>
          </div>
          <div className="stat">
            <span>Customers</span><strong>{customers.length}</strong>
            <small>Registered customers</small>
          </div>
          <div className="stat">
            <span>Outstanding balance</span><strong>{money(outstanding)}</strong>
            <small>Based on outstanding balance</small>
          </div>
          <div className="stat">
            <span>Paid loans</span><strong>{paid}</strong>
            <small>Marked as paid</small>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{tab} records</h2>
              <p>Live records from your Supabase database</p>
            </div>
            <div className="tools">
              <div className="search">
                <Search size={16} />
                <input value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search records" />
              </div>
            </div>
          </div>

          {loading ? <div className="empty">Loading your records…</div> :
            filtered.length === 0 ?
              <div className="empty">
                {configured ? 'No records found, or the selected table is empty.' :
                  'Connect Supabase to display your existing records.'}
              </div> :
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    {cols.map(k => <th key={k}>{k.replaceAll('_', ' ')}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={row.id ?? i}>
                        {cols.map(k => (
                          <td key={k}>
                            {row[k] === null ? '—' :
                              typeof row[k] === 'object' ?
                                JSON.stringify(row[k]) : String(row[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </section>

        <footer>
          <span>ASURE ENTERPRISES</span>
          <span className={connected ? 'good' : 'muted'}>
            {connected ? '● Connected to Supabase' : '● Not connected'}
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
