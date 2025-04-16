// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList } from 'recharts';
import './dashboard.css';

const CATEGORY_LABELS = {
  '1': 'Retainer',
  '2': 'Administrative',
  '3': 'Special Project',
  '4': 'Labor',
  '5': 'Litigation',
  '6': 'Pro Bono',
  '7': 'Temporary',
  '8': 'Internal Office',
};

function Dashboard() {
  const [mattersByCategory, setMattersByCategory] = useState([]);
  const [lawyerWorkload, setLawyerWorkload] = useState({ Partner: [], 'Junior Partner': [], 'Senior Associate': [], Associate: [] });
  const [loading, setLoading] = useState(true);

  // Summary stats
  const totalMatters = mattersByCategory.reduce((sum, c) => sum + c.count, 0);
  const totalLawyers = Object.values(lawyerWorkload).reduce((sum, arr) => sum + arr.length, 0);
  // Helper to calculate median
  function median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
  }

  // Helper to assign role badge color
  function roleColor(role) {
    switch (role) {
      case 'Partner': return '#4F8CFF';
      case 'Junior Partner': return '#38BDF8';
      case 'Senior Associate': return '#A5B4FC';
      case 'Associate': return '#64748B';
      default: return '#23272F';
    }
  }

  // Collect all lawyer matter counts for median calculation
  const allCounts = Object.values(lawyerWorkload).flat().map(lawyer => lawyer.activeMatterCount);
  const medianMattersPerLawyer = median(allCounts);
  const juniorCounts = (lawyerWorkload['Junior Partner'] || []).map(lawyer => lawyer.activeMatterCount);
  const medianJunior = median(juniorCounts);
  const seniorCounts = (lawyerWorkload['Senior Associate'] || []).map(lawyer => lawyer.activeMatterCount);
  const medianSenior = median(seniorCounts);
  const associateCounts = (lawyerWorkload['Associate'] || []).map(lawyer => lawyer.activeMatterCount);
  const medianAssociate = median(associateCounts);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [catRes, lawyerRes] = await Promise.all([
        axios.get('/dashboard/matters-by-category'),
        axios.get('/dashboard/lawyer-workload'),
      ]);
      setMattersByCategory(
        catRes.data.map(item => ({
          category: CATEGORY_LABELS[item.category] || item.category,
          count: item.count,
        }))
      );
      setLawyerWorkload(lawyerRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const text = '#f1f1f1';
  const accent = '#1976d2';
  const faded = '#7da2e3';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <span className="dashboard-title">Law Firm Admin Dashboard</span>
        {/* Optionally add a logo/avatar here */}
      </header>

      <section className="dashboard-summary-cards">
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Total Active Matters</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4F8CFF' }}>{totalMatters}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Total Lawyers</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4F8CFF' }}>{totalLawyers}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Median Matters per Lawyer</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4F8CFF' }}>{medianMattersPerLawyer}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Median (Junior Partners)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#38BDF8' }}>{medianJunior}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Median (Senior Associates)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#A5B4FC' }}>{medianSenior}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 16, color: '#A0AEC0' }}>Median (Associates)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#A5B4FC' }}>{medianAssociate}</div>
        </div>
      </section>

      <section className="dashboard-chart-section card">
        <h2 style={{ color: '#E5EAF2', marginBottom: 16 }}>Active Matters by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mattersByCategory} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2C313A" />
            <XAxis dataKey="category" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip contentStyle={{ background: '#23272F', border: '1px solid #2C313A', color: '#E5EAF2' }} />
            <Bar dataKey="count" fill="#4F8CFF" radius={[4, 4, 0, 0]} isAnimationActive>
              <LabelList dataKey="count" position="top" fill="#E5EAF2" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="dashboard-workload-section">
        <h2 style={{ color: '#E5EAF2' }}>Lawyer Workload by Role</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {['Partner', 'Junior Partner', 'Senior Associate', 'Associate'].map(rank => (
            <div key={rank} className="card" style={{ flex: 1, minWidth: 220, minHeight: 240, margin: 8 }}>
              <h3 style={{ textAlign: 'center', color: '#A0AEC0', marginBottom: 12 }}>
                <span className="role-badge" style={{ background: roleColor(rank) }}>{rank}s</span>
              </h3>
              <ul className="lawyer-list">
                {lawyerWorkload[rank] && lawyerWorkload[rank].length > 0 ? (
                  lawyerWorkload[rank].map(lawyer => (
                    <li key={lawyer.name} className="lawyer-list-item">
                      <span>{lawyer.name}</span>
                      <span style={{ fontWeight: 600, color: '#4F8CFF' }}>{lawyer.activeMatterCount}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ color: '#64748B', textAlign: 'center' }}>No lawyers</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {loading && <div style={{ marginTop: 24, color: faded }}>Loading...</div>}
    </div>
  );
}

export default Dashboard;
