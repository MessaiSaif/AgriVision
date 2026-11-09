import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Trash2, Edit2, Loader, ArrowLeft, DollarSign, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORY_LABELS = {
  FERTILIZER: 'Engrais',
  PESTICIDE: 'Pesticide',
  SEED: 'Semences',
  EQUIPMENT: 'Équipement',
  OTHER: 'Autre',
};

function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'FERTILIZER', quantity: 0, unit: 'L' });
  const [recordExpense, setRecordExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [financeSyncBanner, setFinanceSyncBanner] = useState(null);

  useEffect(() => {
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
    fetchData();
  }, [navigate]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'FERTILIZER', quantity: '', unit: 'L' });
    setRecordExpense(false);
    setExpenseAmount('');
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
    });
    setRecordExpense(false);
    setExpenseAmount('');
    setShowAddModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
      };

      let savedItem;
      if (editingItem) {
        const res = await api.put(`inventory/${editingItem.id}/`, payload);
        savedItem = res.data;
        setItems(items.map(i => (i.id === editingItem.id ? savedItem : i)));
      } else {
        const res = await api.post('inventory/', payload);
        savedItem = res.data;
        setItems([savedItem, ...items]);
      }

      // Smart Workflow : Enregistrer automatiquement la dépense dans les Finances
      if (recordExpense && parseFloat(expenseAmount) > 0) {
        const today = new Date().toISOString().split('T')[0];
        await api.post('finances/', {
          record_type: 'EXPENSE',
          amount: parseFloat(expenseAmount).toFixed(2),
          date: today,
          category: CATEGORY_LABELS[savedItem.category] || 'Intrants',
          description: `Achat stock : ${savedItem.name} (${savedItem.quantity} ${savedItem.unit})`,
        });
        setFinanceSyncBanner(
          `Dépense de ${parseFloat(expenseAmount).toFixed(2)} enregistrée pour "${savedItem.name}".`
        );
      }

      setShowAddModal(false);
      setEditingItem(null);
    } catch {
      alert("Erreur lors de l'enregistrement de l'article.");
    }
  };

  const handleQuickAdjust = async (item, delta) => {
    const updatedQty = Math.max(0, Number((parseFloat(item.quantity) + delta).toFixed(2)));
    try {
      const res = await api.put(`inventory/${item.id}/`, {
        name: item.name,
        category: item.category,
        quantity: updatedQty,
        unit: item.unit,
      });
      setItems(items.map(i => (i.id === item.id ? res.data : i)));
    } catch {
      alert("Erreur lors de la mise à jour du stock.");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await api.delete(`inventory/${id}/`);
      setItems(items.filter(i => i.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'white', outline: 'none', marginBottom: '1rem', fontFamily: 'inherit'
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}><Loader size={40} style={{ animation: 'spin 1s linear infinite' }} color="var(--color-primary)" /></div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Retour au Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--color-primary)" /> Inventaire
        </h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Ajouter au stock
        </button>
      </div>

      {financeSyncBanner && (
        <div className="glass-card animate-fade-in" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)', fontWeight: 500 }}>
            <Check size={18} /> {financeSyncBanner}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/finances" style={{ color: 'white', fontWeight: 600, textDecoration: 'underline', fontSize: '0.9rem' }}>
              Voir dans Finances →
            </Link>
            <button onClick={() => setFinanceSyncBanner(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Catégorie</th>
              <th style={{ padding: '1rem' }}>Quantité en stock</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge" style={{ marginBottom: 0 }}>
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => handleQuickAdjust(item, -1)}
                      disabled={item.quantity <= 0}
                      title="Diminuer de 1"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: item.quantity <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.quantity <= 0 ? 0.4 : 1 }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'center', color: item.quantity <= 2 ? '#f59e0b' : 'white' }}>
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleQuickAdjust(item, 1)}
                      title="Augmenter de 1"
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Modifier l'article"
                      style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer' }}
                    >
                      <Edit2 size={19} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Supprimer l'article"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
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
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem ? "Modifier l'article" : 'Nouvel Article'}</h2>
            <form onSubmit={handleSaveItem}>
              <input style={inputStyle} placeholder="Nom (ex: Engrais NPK)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="FERTILIZER" style={{color: 'black'}}>Engrais (Fertilizer)</option>
                <option value="PESTICIDE" style={{color: 'black'}}>Pesticide</option>
                <option value="SEED" style={{color: 'black'}}>Semences</option>
                <option value="EQUIPMENT" style={{color: 'black'}}>Équipement</option>
                <option value="OTHER" style={{color: 'black'}}>Autre</option>
              </select>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input style={{...inputStyle, flex: 2}} type="number" step="0.01" min="0" placeholder="Quantité" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                <input style={{...inputStyle, flex: 1}} placeholder="Unité (ex: Kg, L)" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>

              {/* Smart Workflow : Synchronisation automatique avec les Finances */}
              <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.92rem', color: 'white', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={recordExpense}
                    onChange={e => setRecordExpense(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <DollarSign size={16} color="var(--color-primary)" />
                  Enregistrer cet achat dans les Finances (Dépense)
                </label>
                {recordExpense && (
                  <input
                    style={{ ...inputStyle, marginTop: '0.75rem', marginBottom: 0 }}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Montant total payé (ex: 150.00)"
                    required={recordExpense}
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
