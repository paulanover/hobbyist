// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, LabelList } from 'recharts';

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
  const [lawyerWorkload, setLawyerWorkload] = useState({ Partner: [], 'Senior Associate': [], Associate: [] });
  const [loading, setLoading] = useState(true);

  // Summary stats
  const totalMatters = mattersByCategory.reduce((sum, c) => sum + c.count, 0);
  const totalLawyers = Object.values(lawyerWorkload).reduce((sum, arr) => sum + arr.length, 0);
  // Helper to calculate median from an array
  function median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
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

  // Theme colors
  const bg = '#181e2a';
  const cardBg = '#232c3d';
  const cardBorder = '#2a3650';
  const text = '#f1f1f1';
  const accent = '#1976d2';
  const faded = '#7da2e3';

  return (
    <div style={{ padding: 24, background: bg, minHeight: '100vh', color: text }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Total Active Matters</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{totalMatters}</div>
        </div>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Total Lawyers</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{totalLawyers}</div>
        </div>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Median Matters per Lawyer</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{medianMattersPerLawyer}</div>
        </div>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Median (Junior Partners)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{medianJunior}</div>
        </div>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Median (Senior Associates)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{medianSenior}</div>
        </div>
        <div style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: faded }}>Median (Associates)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: accent }}>{medianAssociate}</div>
        </div>
      </div>

      <h2 style={{ color: text }}>Active Matters by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={mattersByCategory} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
          <XAxis dataKey="category" stroke={text} tick={{ fill: text }} />
          <YAxis allowDecimals={false} stroke={text} tick={{ fill: text }} />
          <Tooltip wrapperStyle={{ background: cardBg, border: `1px solid ${cardBorder}`, color: text }} contentStyle={{ background: cardBg, color: text, border: `1px solid ${cardBorder}` }} labelStyle={{ color: text }} itemStyle={{ color: text }} cursor={{ fill: '#223' }} />
          <Legend wrapperStyle={{ color: faded }} />
          <Bar dataKey="count" fill={accent}>
            <LabelList dataKey="count" position="top" fill={text} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <h2 style={{ marginTop: 48, color: text }}>Lawyer Workload (Active Matters)</h2>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'space-between' }}>
        {['Partner', 'Junior Partner', 'Senior Associate', 'Associate'].map(rank => (
          <div key={rank} style={{ flex: 1, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 16, minHeight: 240 }}>
            <h3 style={{ textAlign: 'center', color: faded }}>{rank}s</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {lawyerWorkload[rank] && lawyerWorkload[rank].length > 0 ? (
                lawyerWorkload[rank].map(lawyer => (
                  <li key={lawyer.name} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', color: text }}>
                    <span>{lawyer.name}</span>
                    <span style={{ fontWeight: 600, color: accent }}>{lawyer.activeMatterCount}</span>
                  </li>
                ))
              ) : (
                <li style={{ color: faded, textAlign: 'center' }}>No lawyers</li>
              )}
            </ul>
          </div>
        ))}
      </div>
      {loading && <div style={{ marginTop: 24, color: faded }}>Loading...</div>}
    </div>
  );
}

export default Dashboard;
