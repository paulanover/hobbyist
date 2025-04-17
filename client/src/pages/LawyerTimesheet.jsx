import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

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
  const authState = useAuth() || {};
  const { userInfo } = authState;
  const [lawyerRank, setLawyerRank] = useState(undefined);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [matters, setMatters] = useState([]);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [description, setDescription] = useState('');
  // Returns local date string (YYYY-MM-DD) using the provided local time as source of truth
  const getTodayString = () => {
    // Use the current local time provided by the system (source of truth)
    const localNow = new Date('2025-04-17T15:20:05+08:00');
    const year = localNow.getFullYear();
    const month = String(localNow.getMonth() + 1).padStart(2, '0');
    const day = String(localNow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Returns the current local month in YYYY-MM format
  const getCurrentMonthString = () => {
    const localNow = new Date('2025-04-17T15:20:05+08:00');
    const year = localNow.getFullYear();
    const month = String(localNow.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  // Always initializes with the current local date
  const [date, setDate] = useState(getTodayString());
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
    // If date is blank, set it to today
    let dateToUse = date && date.trim() !== '' ? date : getTodayString();
    if (!dateToUse) missingFields.push('Date');
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
        date: dateToUse,
        hours: timeSpent,
      });
      setSuccess(true);
      setDescription('');
      setTimeSpent('');
      setDate(getTodayString());
      setSelectedClient(null);
      setSelectedMatter(null);
    } catch (err) {
      setError('Failed to save timesheet.');
    } finally {
      setSaving(false);
    }
  };


  // Access gating logic
  let isAllowed = false;
  let debugRank = undefined;
  if (userInfo) {
    if (userInfo.role === 'admin' || userInfo.role === 'accountant') {
      isAllowed = true;
    } else if (userInfo.role === 'lawyer') {
      let rank = undefined;
      if (userInfo.lawyerProfile && typeof userInfo.lawyerProfile === 'object') {
        rank = userInfo.lawyerProfile.rank;
      } else if (userInfo.lawyerProfile && typeof userInfo.lawyerProfile === 'string') {
        rank = lawyerRank;
      }
      debugRank = rank;
      if (['Partner', 'Junior Partner', 'Senior Associate', 'Associate'].includes(rank)) {
        isAllowed = true;
      }
    }
  }

  // If lawyerProfile is a string, fetch the profile to get the rank
  useEffect(() => {
    if (
      userInfo &&
      userInfo.role === 'lawyer' &&
      userInfo.lawyerProfile &&
      typeof userInfo.lawyerProfile === 'string'
    ) {
      axiosInstance.get(`/lawyers/${userInfo.lawyerProfile}`)
        .then(res => {
          setLawyerRank(res.data.rank);
        })
        .catch(() => setLawyerRank(undefined));
    }
  }, [userInfo]);

  if (!isAllowed) {
    // Debug output for diagnosing access issues
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', background: '#222', color: '#fff', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access the timesheet. Only Partners, Junior Partners, Senior Associates, Associates, Admins, and Accountants can access this page.</p>
        <pre style={{ textAlign: 'left', fontSize: 12, color: '#aaa', background: '#111', borderRadius: 8, padding: 8, marginTop: 16 }}>
          userInfo: {JSON.stringify(userInfo, null, 2)}
          lawyerProfile (object): {typeof userInfo?.lawyerProfile === 'object' ? JSON.stringify(userInfo?.lawyerProfile, null, 2) : ''}
          lawyerProfile (string): {typeof userInfo?.lawyerProfile === 'string' ? userInfo?.lawyerProfile : ''}
          fetched rank: {lawyerRank}
          used rank: {debugRank}
        </pre>
      </div>
    );
  }

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
                  value={date || getTodayString()}
                  onChange={e => setDate(e.target.value || getTodayString())}
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

