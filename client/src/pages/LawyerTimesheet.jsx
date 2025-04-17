import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { CircularProgress } from '@mui/material';

class TimesheetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    if (window && window.console) {
      console.error('Timesheet error:', error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: '40px auto', background: '#222', color: '#fff', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>The timesheet could not be loaded. Please try refreshing the page.</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>
            If you are on mobile Safari and this keeps happening, try clearing your browser cache or use another browser.<br/>
            If the problem persists, contact support and mention: <br/><code>{this.state.error?.toString()}</code>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function LawyerTimesheet() {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [matters, setMatters] = useState([]);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    // Set default to today's date in YYYY-MM-DD
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [timeSpent, setTimeSpent] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 1. Load all relevant clients on mount
  useEffect(() => {
    setLoadingClients(true);
    axiosInstance.get('/clients/for-lawyer-relevant')
      .then(res => setClients(res.data))
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false));
  }, []);

  // 2. Load matters for selected client
  useEffect(() => {
    if (!selectedClient) {
      setMatters([]);
      setSelectedMatter(null);
      return;
    }
    setLoadingMatters(true);
    axiosInstance.get(`/clients/${selectedClient._id}/matters/for-lawyer`)
      .then(res => setMatters(res.data))
      .catch(() => setMatters([]))
      .finally(() => setLoadingMatters(false));
  }, [selectedClient]);

  // 3. Save timesheet
  const handleSave = async () => {
    setError('');
    setSuccess(false);
    const missingFields = [];
    if (!selectedClient) missingFields.push('Client');
    if (!selectedMatter) missingFields.push('Matter');
    if (!date) missingFields.push('Date');
    if (!description.trim()) missingFields.push('Description');
    if (!timeSpent) missingFields.push('Time Spent');
    if (missingFields.length) {
      setError('Please fill in the following fields: ' + missingFields.join(', '));
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post('/time-entries', {
        client: selectedClient._id,
        matter: selectedMatter._id,
        description,
        date,
        hours: timeSpent,
      });
      setSuccess(true);
      setDescription('');
      setTimeSpent('');
      setDate('');
      setSelectedClient(null);
      setSelectedMatter(null);
    } catch (err) {
      setError('Failed to save timesheet.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <TimesheetErrorBoundary>
      {error && (
        <div style={{ color: 'red', background: '#fff0f0', padding: 10, borderRadius: 8, margin: '20px auto', maxWidth: 480, textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
      )}
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', background: 'var(--bg-card)', padding: 24, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent-blue)', marginBottom: 24 }}>Electronic Timesheet</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. List all clients */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ marginBottom: 2 }}>Client</label>
            {loadingClients ? (
              <div style={{ textAlign: 'center', padding: 16 }}><CircularProgress size={24} /></div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {clients.map(client => (
                  <li key={client._id}>
                    <button
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: '1px solid #ccc',
                        borderRadius: 8,
                        marginBottom: 6,
                        background: selectedClient && selectedClient._id === client._id ? 'var(--accent-blue)' : '#fff',
                        color: selectedClient && selectedClient._id === client._id ? '#fff' : '#222',
                        fontWeight: selectedClient && selectedClient._id === client._id ? 600 : 400,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedClient(client);
                        setSelectedMatter(null);
                        setSuccess(false);
                        setError('');
                      }}
                    >
                      {client.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* 2. List matters for selected client */}
          {selectedClient && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ marginBottom: 2 }}>Matter</label>
              {loadingMatters ? (
                <div style={{ textAlign: 'center', padding: 16 }}><CircularProgress size={20} /></div>
              ) : matters.length === 0 ? (
                <div style={{ color: '#888', fontStyle: 'italic', padding: 8 }}>No matters found for this client.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {matters.map(matter => (
                    <li key={matter._id}>
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 12px',
                          border: '1px solid #ccc',
                          borderRadius: 8,
                          marginBottom: 6,
                          background: selectedMatter && selectedMatter._id === matter._id ? 'var(--accent-blue)' : '#fff',
                          color: selectedMatter && selectedMatter._id === matter._id ? '#fff' : '#222',
                          fontWeight: selectedMatter && selectedMatter._id === matter._id ? 600 : 400,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedMatter(matter);
                          setSuccess(false);
                          setError('');
                        }}
                      >
                        {matter.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* 3. Description and time fields */}
          {selectedMatter && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ marginBottom: 2 }}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ marginBottom: 2 }}>Description of Work</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe work done..."
                  rows={3}
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', resize: 'vertical', minHeight: 60 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ marginBottom: 2 }}>Time Spent (hours)</label>
                <input
                  type="number"
                  value={timeSpent}
                  onChange={e => setTimeSpent(e.target.value)}
                  placeholder="e.g. 1.5"
                  min="0"
                  step="0.1"
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', marginTop: 8, padding: '12px 0', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontWeight: 600, fontSize: 16 }}
              >
                {saving ? 'Saving...' : 'Save Timesheet'}
              </button>
              {success && <div style={{ color: 'green', marginTop: 10, textAlign: 'center' }}>Timesheet saved!</div>}
              {error && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{error}</div>}
            </>
          )}
        </div>
      </div>
    </TimesheetErrorBoundary>
  );
}

