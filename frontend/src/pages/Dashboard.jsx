import React, { useState, useEffect } from 'react';
import { Leaf, Plus, List, BarChart2, Settings, LogOut, Loader, X, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyProfile, logout } from '../services/auth';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cultures, setCultures] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCulture, setNewCulture] = useState({ name: '', plant_type: '', planting_date: '', location: '' });
  const [activeTab, setActiveTab] = useState('cultures');

  useEffect(() => {
    // Charger les données au montage du composant
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileData, culturesData, analysesData] = await Promise.all([
        getMyProfile(),
        api.get('cultures/'),
        api.get('analyses/recent/')
      ]);
      setUser(profileData);
      setCultures(culturesData.data);
      setAnalyses(analysesData.data);
    } catch (err) {
      // Si non authentifié, rediriger vers la connexion
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddCulture = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('cultures/', newCulture);
      setCultures([response.data, ...cultures]);
      setShowAddModal(false);
      setNewCulture({ name: '', plant_type: '', planting_date: '', location: '' });
    } catch (err) {
      alert("Erreur lors de l'ajout de la culture.");
    }
  };

  const handleDeleteCulture = async (id) => {
    if (!window.confirm("Supprimer cette culture ?")) return;
    await api.delete(`cultures/${id}/`);
    setCultures(cultures.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader size={40} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const sidebarItems = [
    { label: 'Mes Cultures', icon: <List size={20} />, id: 'cultures' },
    { label: 'Analyses récentes', icon: <BarChart2 size={20} />, id: 'analyses' },
    { label: 'Paramètres', icon: <Settings size={20} />, id: 'settings' },
  ];

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '1rem',
  };

  const AVAILABLE_PLANTS = [
    "Pomme", "Myrtille", "Cerise", "Maïs", "Raisin", 
    "Orange", "Pêche", "Poivron", "Pomme de terre", 
    "Framboise", "Soja", "Courge", "Fraise", "Tomate"
  ];

  return (
    <>
      {/* Modal d'ajout de culture */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Ajouter une culture</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCulture} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input style={inputStyle} placeholder="Nom du champ (ex: Champ Nord)" required value={newCulture.name} onChange={e => setNewCulture({...newCulture, name: e.target.value})} />
              <select style={{ ...inputStyle, cursor: 'pointer' }} required value={newCulture.plant_type} onChange={e => setNewCulture({...newCulture, plant_type: e.target.value})}>
                <option value="" disabled>Sélectionnez un type de plante</option>
                {AVAILABLE_PLANTS.map(plant => (
                  <option key={plant} value={plant} style={{ color: 'black' }}>{plant}</option>
                ))}
              </select>
              <input style={inputStyle} type="date" required value={newCulture.planting_date} onChange={e => setNewCulture({...newCulture, planting_date: e.target.value})} />
              <input style={inputStyle} placeholder="Localisation (optionnel)" value={newCulture.location} onChange={e => setNewCulture({...newCulture, location: e.target.value})} />
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Enregistrer la culture</button>
            </form>
          </div>
        </div>
      )}

      <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <nav className="navbar animate-fade-in">
          <Link to="/" className="logo"><Leaf size={28} />Agri<span>Vision</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Bonjour, <strong style={{ color: 'white' }}>{user?.username}</strong></span>
            <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.5rem 1rem', gap: '0.5rem' }}>
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', flex: 1, paddingBottom: '3rem' }}>
          {/* Sidebar */}
          <aside className="glass-card animate-fade-in delay-1" style={{ padding: '1.5rem 1rem', height: 'fit-content' }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {sidebarItems.map(item => (
                <li key={item.id}>
                  <button onClick={() => setActiveTab(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', width: '100%', background: activeTab === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500, transition: 'all 0.2s', textAlign: 'left' }}>
                    {item.icon} {item.label}
                  </button>
                </li>
              ))}
              <li style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <Link to="/diseases"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                  <BookOpen size={20} /> Catalogue Maladies
                </Link>
              </li>
              <li>
                <Link to="/"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                  <Leaf size={20} /> Nouvelle Analyse
                </Link>
              </li>
            </ul>
          </aside>

          {/* Contenu principal */}
          <main className="animate-fade-in delay-2">
            {activeTab === 'cultures' && (
              <>
                {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Cultures', value: cultures.length, color: 'var(--color-primary)' },
              { label: 'Analyses', value: analyses.length, color: '#0ea5e9' },
              { label: 'Maladies BD', value: 38, color: '#a78bfa' },
            ].map(stat => (
              <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, marginBottom: '0.25rem' }}>{stat.value}</p>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2>Mes Cultures <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '1.2rem' }}>({cultures.length})</span></h2>
                  <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }} onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Ajouter
                  </button>
                </div>
                {cultures.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <Leaf size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <p>Vous n'avez pas encore de culture. Ajoutez-en une !</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2">
                    {cultures.map(culture => (
                      <div key={culture.id} className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <h3 style={{ fontSize: '1.15rem', color: 'white' }}>{culture.name}</h3>
                          <span className="badge">{culture.plant_type}</span>
                        </div>
                        {culture.location && <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 {culture.location}</p>}
                        <p style={{ fontSize: '0.9rem' }}>Planté le : {new Date(culture.planting_date).toLocaleDateString('fr-FR')}</p>
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Analyser →</Link>
                          <button onClick={() => handleDeleteCulture(culture.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem' }}>Supprimer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'analyses' && (
              <>
                <h2 style={{ marginBottom: '2rem' }}>Analyses récentes</h2>
                {analyses.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <BarChart2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <p>Aucune analyse effectuée pour l'instant.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analyses.map(a => (
                      <div key={a.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{a.disease_info?.name || 'Analyse en attente'}</p>
                          <p style={{ fontSize: '0.85rem' }}>{new Date(a.date).toLocaleString('fr-FR')}</p>
                        </div>
                        {a.confidence && (
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '100px', fontWeight: 600 }}>
                            {Math.round(a.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'settings' && (
              <div className="glass-card">
                <h2>Paramètres</h2>
                <p style={{ marginTop: '1rem' }}>Fonctionnalité en cours de développement.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
