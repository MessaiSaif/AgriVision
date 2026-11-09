import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Loader, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Finances() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ record_type: 'EXPENSE', amount: '', date: '', description: '', category: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('finances/');
        setRecords(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('finances/', newRecord);
      setRecords([res.data, ...records]);
      setShowAddModal(false);
      setNewRecord({ record_type: 'EXPENSE', amount: '', date: '', description: '', category: '' });
    } catch {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Supprimer cet enregistrement ?")) return;
    try {
      await api.delete(`finances/${id}/`);
      setRecords(records.filter(r => r.id !== id));
    } catch {
      alert("Erreur");
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'white', outline: 'none', marginBottom: '1rem', fontFamily: 'inherit'
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}><Loader size={40} className="spin" color="var(--color-primary)" /></div>;

  const totalIncome = records.filter(r => r.record_type === 'INCOME').reduce((acc, r) => acc + parseFloat(r.amount), 0);
  const totalExpense = records.filter(r => r.record_type === 'EXPENSE').reduce((acc, r) => acc + parseFloat(r.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Retour au Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DollarSign size={32} color="var(--color-primary)" /> Finances
        </h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Nouvelle Transaction
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-text-muted)' }}>Revenus</h3>
          <p style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>+ {totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-text-muted)' }}>Dépenses</h3>
          <p style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 'bold' }}>- {totalExpense.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--color-text-muted)' }}>Bilan</h3>
          <p style={{ fontSize: '1.5rem', color: balance >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Description</th>
              <th style={{ padding: '1rem' }}>Catégorie</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Montant</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem' }}>{r.date}</td>
                <td style={{ padding: '1rem' }}>{r.description}</td>
                <td style={{ padding: '1rem' }}>{r.category || '-'}</td>
                <td style={{ padding: '1rem', textAlign: 'right', color: r.record_type === 'INCOME' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {r.record_type === 'INCOME' ? '+' : '-'}{r.amount}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleDeleteRecord(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune transaction trouvée.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nouvelle Transaction</h2>
            <form onSubmit={handleAddRecord}>
              <select style={inputStyle} value={newRecord.record_type} onChange={e => setNewRecord({...newRecord, record_type: e.target.value})}>
                <option value="EXPENSE" style={{color: 'black'}}>Dépense</option>
                <option value="INCOME" style={{color: 'black'}}>Revenu</option>
              </select>
              <input style={inputStyle} type="date" required value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
              <input style={inputStyle} placeholder="Description" required value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} />
              <input style={inputStyle} placeholder="Catégorie (optionnel)" value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})} />
              <input style={inputStyle} type="number" step="0.01" placeholder="Montant" required value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finances;
