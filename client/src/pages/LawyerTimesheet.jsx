import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

class TimesheetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Optionally log error
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
  const [clientQuery, setClientQuery] = useState('');
  const [clientOptions, setClientOptions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [matterQuery, setMatterQuery] = useState('');
  const [matterOptions, setMatterOptions] = useState([]);
  const [selectedMatter, setSelectedMatter] = useState(null);

  const [description, setDescription] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete for clients
  useEffect(() => {
    if (clientQuery.length < 2) return;
    const controller = new AbortController();
    axios.get(`/api/clients?search=${encodeURIComponent(clientQuery)}`, {
      signal: controller.signal,
    })
      .then(res => setClientOptions(res.data))
      .catch(() => {});
    return () => controller.abort();
  }, [clientQuery]);

  // Autocomplete for matters (when client selected)
  useEffect(() => {
    if (!selectedClient || matterQuery.length < 2) return;
    const controller = new AbortController();
    axios.get(`/api/clients/${selectedClient._id}/matters?search=${encodeURIComponent(matterQuery)}`, {
      signal: controller.signal,
    })
      .then(res => setMatterOptions(res.data))
      .catch(() => {});
    return () => controller.abort();
  }, [matterQuery, selectedClient]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post('/api/timesheets', {
        client: selectedClient._id,
        matter: selectedMatter._id,
        description,
        timeSpent,
      });
      setSuccess(true);
      setDescription('');
      setTimeSpent('');
      setSelectedClient(null);
      setSelectedMatter(null);
      setClientQuery('');
      setMatterQuery('');
    } catch (err) {
      setError('Failed to save timesheet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TimesheetErrorBoundary>
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', background: 'var(--bg-card)', padding: 24, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent-blue)', marginBottom: 24 }}>Electronic Timesheet</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Client autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ marginBottom: 2 }}>Client</label>
            <input
              type="text"
              value={selectedClient ? selectedClient.name : clientQuery}
              onChange={e => {
                setSelectedClient(null);
                setClientQuery(e.target.value);
              }}
              placeholder="Start typing client name..."
              autoComplete="off"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
            {clientOptions.length > 0 && !selectedClient && (
              <ul className="card" style={{ position: 'absolute', zIndex: 2, width: '92%', margin: 0, padding: 0, listStyle: 'none', background: '#222', borderRadius: 8, top: '100%' }}>
                {clientOptions.map(client => (
                  <li key={client._id} style={{ padding: 10, cursor: 'pointer' }} onClick={() => {
                    setSelectedClient(client);
                    setClientQuery(client.name);
                    setClientOptions([]);
                  }}>{client.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Matter autocomplete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ marginBottom: 2 }}>Matter</label>
            <input
              type="text"
              value={selectedMatter ? selectedMatter.title : matterQuery}
              onChange={e => {
                setSelectedMatter(null);
                setMatterQuery(e.target.value);
              }}
              placeholder="Start typing matter..."
              autoComplete="off"
              disabled={!selectedClient}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
            {matterOptions.length > 0 && !selectedMatter && (
              <ul className="card" style={{ position: 'absolute', zIndex: 2, width: '92%', margin: 0, padding: 0, listStyle: 'none', background: '#222', borderRadius: 8, top: '100%' }}>
                {matterOptions.map(matter => (
                  <li key={matter._id} style={{ padding: 10, cursor: 'pointer' }} onClick={() => {
                    setSelectedMatter(matter);
                    setMatterQuery(matter.title);
                    setMatterOptions([]);
                  }}>{matter.title}</li>
                ))}
              </ul>
            )}
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

          <button onClick={handleSave} disabled={saving || !selectedClient || !selectedMatter || !description || !timeSpent} style={{ width: '100%', marginTop: 8, padding: '12px 0', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', fontWeight: 600, fontSize: 16 }}>
            {saving ? 'Saving...' : 'Save Timesheet'}
          </button>
          {success && <div style={{ color: 'green', marginTop: 10, textAlign: 'center' }}>Timesheet saved!</div>}
          {error && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{error}</div>}
        </div>
      </div>
    </TimesheetErrorBoundary>
  );
}
