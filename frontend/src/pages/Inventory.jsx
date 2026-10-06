import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit2, Loader, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'FERTILIZER', quantity: 0, unit: 'L' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('inventory/');
      setItems(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('inventory/', newItem);
      setItems([res.data, ...items]);
      setShowAddModal(false);
      setNewItem({ name: '', category: 'FERTILIZER', quantity: 0, unit: 'L' });
    } catch (err) {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await api.delete(`inventory/${id}/`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert("Erreur");
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'white', outline: 'none', marginBottom: '1rem', fontFamily: 'inherit'
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}><Loader size={40} className="spin" color="var(--color-primary)" /></div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Retour au Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--color-primary)" /> Inventaire
        </h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Ajouter au stock
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Catégorie</th>
              <th style={{ padding: '1rem' }}>Quantité</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem' }}>{item.name}</td>
                <td style={{ padding: '1rem' }}>{item.category}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Inventaire vide.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nouvel Article</h2>
            <form onSubmit={handleAddItem}>
              <input style={inputStyle} placeholder="Nom (ex: Engrais NPK)" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <select style={inputStyle} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="FERTILIZER" style={{color: 'black'}}>Engrais (Fertilizer)</option>
                <option value="PESTICIDE" style={{color: 'black'}}>Pesticide</option>
                <option value="SEED" style={{color: 'black'}}>Semences</option>
                <option value="EQUIPMENT" style={{color: 'black'}}>Équipement</option>
                <option value="OTHER" style={{color: 'black'}}>Autre</option>
              </select>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input style={{...inputStyle, flex: 2}} type="number" step="0.01" placeholder="Quantité" required value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
                <input style={{...inputStyle, flex: 1}} placeholder="Unité (ex: Kg, L)" required value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
