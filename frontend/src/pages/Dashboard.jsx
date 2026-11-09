import React, { useState, useEffect } from 'react';
import { Leaf, Plus, List, BarChart2, Settings, LogOut, Loader, X, BookOpen, CheckSquare, Package, DollarSign, CalendarPlus, Check, Eye, Trash2, User, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, logout } from '../services/auth';
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

  // Détail d'une analyse sélectionnée & création de tâche
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [creatingTaskForId, setCreatingTaskForId] = useState(null);
  const [createdTaskIds, setCreatedTaskIds] = useState({});

  // État du formulaire Paramètres
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // Charger les données au montage du composant
    const fetchDashboardData = async () => {
      try {
        const [profileData, culturesData, analysesData] = await Promise.all([
          getMyProfile(),
          api.get('cultures/'),
          api.get('analyses/')
        ]);
        setUser(profileData);
        setProfileForm({ username: profileData.username || '', email: profileData.email || '' });
        setCultures(culturesData.data);
        setAnalyses(analysesData.data);
      } catch {
        // Si non authentifié, rediriger vers la connexion
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://127.0.0.1:8000${img.startsWith('/') ? '' : '/'}${img}`;
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
    } catch {
      alert("Erreur lors de l'ajout de la culture.");
    }
  };

  const handleDeleteCulture = async (id) => {
    if (!window.confirm("Supprimer cette culture ?")) return;
    await api.delete(`cultures/${id}/`);
    setCultures(cultures.filter(c => c.id !== id));
  };

  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm("Supprimer cette analyse de l'historique ?")) return;
    try {
      await api.delete(`analyses/${id}/`);
      setAnalyses(analyses.filter(a => a.id !== id));
      if (selectedAnalysis?.id === id) setSelectedAnalysis(null);
    } catch {
      alert("Erreur lors de la suppression de l'analyse.");
    }
  };

  const handleCreateTaskFromAnalysis = async (analysis) => {
    if (!analysis || creatingTaskForId === analysis.id || createdTaskIds[analysis.id]) return;
    setCreatingTaskForId(analysis.id);
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const diseaseName = analysis.disease_info?.name || 'Diagnostic';
      const isHealthy = diseaseName.toLowerCase().includes('healthy');
      const cultureObj = analysis.culture_info || cultures.find(c => c.id === analysis.culture);
      const cultureLabel = cultureObj ? `${cultureObj.name} (${cultureObj.plant_type})` : 'Culture';
      const confidencePct = Math.round((analysis.confidence || 0) * 100);

      const title = isHealthy
        ? `Contrôle sanitaire de suivi — ${cultureLabel}`
        : `Traitement : ${diseaseName} — ${cultureLabel}`;
      const description = analysis.disease_info?.advice
        ? `Diagnostic IA (${confidencePct}% de confiance) : ${diseaseName}.\nTraitement recommandé : ${analysis.disease_info.advice}`
        : `Diagnostic IA (${confidencePct}% de confiance) : ${analysis.disease_info?.description || diseaseName}`;

      await api.post('tasks/', {
        title,
        description,
        culture: analysis.culture,
        due_date: tomorrow,
        status: 'PENDING'
      });
      setCreatedTaskIds(prev => ({ ...prev, [analysis.id]: true }));
    } catch {
      alert("Erreur lors de la création de la tâche.");
    } finally {
      setCreatingTaskForId(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsMsg(null);
    setSavingSettings(true);
    try {
      const updated = await updateMyProfile({
        username: profileForm.username,
        email: profileForm.email,
      });
      setUser(updated);
      setSettingsMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.username?.[0] || errData?.email?.[0] || errData?.error || "Erreur lors de la mise à jour du profil.";
      setSettingsMsg({ type: 'error', text: msg });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSettingsMsg(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setSettingsMsg({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    setSavingSettings(true);
    try {
      await updateMyProfile({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setSettingsMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur lors du changement de mot de passe.";
      setSettingsMsg({ type: 'error', text: msg });
    } finally {
      setSavingSettings(false);
    }
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
              {user?.role !== 'ADMINISTRATEUR' && sidebarItems.map(item => (
                <li key={item.id}>
                  <button onClick={() => setActiveTab(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', width: '100%', background: activeTab === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 500, transition: 'all 0.2s', textAlign: 'left' }}>
                    {item.icon} {item.label}
                  </button>
                </li>
              ))}
              {user?.role !== 'ADMINISTRATEUR' && (
                <>
                  <li style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <Link to="/tasks"
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                      <CheckSquare size={20} /> Mes Tâches
                    </Link>
                  </li>
                  <li>
                    <Link to="/inventory"
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                      <Package size={20} /> Inventaire
                    </Link>
                  </li>
                  <li>
                    <Link to="/finances"
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                      <DollarSign size={20} /> Finances
                    </Link>
                  </li>
                </>
              )}
              <li style={{ marginTop: user?.role === 'ADMINISTRATEUR' ? '0' : '0.5rem', paddingTop: user?.role === 'ADMINISTRATEUR' ? '0' : '0.5rem', borderTop: user?.role === 'ADMINISTRATEUR' ? 'none' : '1px solid var(--color-border)' }}>
                <Link to="/diseases"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                  <BookOpen size={20} /> Catalogue Maladies
                </Link>
              </li>
              {user?.role !== 'ADMINISTRATEUR' && (
                <li>
                  <Link to="/"
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                    <Leaf size={20} /> Nouvelle Analyse
                  </Link>
                </li>
              )}
            </ul>
          </aside>

          {/* Contenu principal */}
          {user?.role === 'ADMINISTRATEUR' ? (
            <main className="animate-fade-in delay-2">
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <Settings size={48} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Panneau d'Administration</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                  En tant qu'administrateur, votre rôle est de gérer la base de données globale (utilisateurs, maladies, plantes). Les fonctionnalités de la ferme (analyses, tâches, inventaire) sont réservées aux agriculteurs.
                </p>
                <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', textDecoration: 'none', fontSize: '1.1rem' }}>
                  Ouvrir l'Admin Django
                </a>
              </div>
            </main>
          ) : (
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
                          <Link to={`/?culture=${culture.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Analyser →</Link>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0 }}>Historique des Analyses <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '1.2rem' }}>({analyses.length})</span></h2>
                  <Link to="/" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', textDecoration: 'none', fontSize: '0.95rem' }}>
                    <Plus size={18} /> Nouvelle Analyse
                  </Link>
                </div>
                {analyses.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <BarChart2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <p>Aucune analyse effectuée pour l'instant.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {analyses.map(a => {
                      const isHealthy = a.disease_info?.name?.toLowerCase().includes('healthy');
                      const cultureObj = a.culture_info || cultures.find(c => c.id === a.culture);
                      const isExpanded = selectedAnalysis?.id === a.id;
                      const imgUrl = getImageUrl(a.image);

                      return (
                        <div key={a.id} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt="Feuille analysée"
                                  style={{ width: '68px', height: '68px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                                />
                              ) : (
                                <div style={{ width: '68px', height: '68px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Leaf size={26} color="var(--color-primary)" />
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                  <p style={{ fontWeight: 600, color: 'white', margin: 0, fontSize: '1.05rem' }}>
                                    {a.disease_info?.name || 'Analyse en attente'}
                                  </p>
                                  {cultureObj && (
                                    <span className="badge" style={{ marginBottom: 0, fontSize: '0.75rem', padding: '0.15rem 0.6rem' }}>
                                      🌱 {cultureObj.name} ({cultureObj.plant_type})
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                                  {new Date(a.date).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {a.confidence != null && (
                                <span style={{
                                  background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                  color: isHealthy ? 'var(--color-primary)' : '#f87171',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '100px',
                                  fontWeight: 600,
                                  fontSize: '0.9rem'
                                }}>
                                  {Math.round(a.confidence * 100)}%
                                </span>
                              )}
                              <button
                                className="btn btn-outline"
                                onClick={() => setSelectedAnalysis(isExpanded ? null : a)}
                                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', gap: '0.4rem' }}
                              >
                                <Eye size={16} /> {isExpanded ? 'Masquer' : 'Diagnostic'}
                              </button>
                              <button
                                onClick={() => handleDeleteAnalysis(a.id)}
                                title="Supprimer l'analyse"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Panneau détaillé de l'analyse + Smart Workflow */}
                          {isExpanded && a.disease_info && (
                            <div className="animate-fade-in" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: imgUrl ? '180px 1fr' : '1fr', gap: '1.5rem' }}>
                              {imgUrl && (
                                <img
                                  src={imgUrl}
                                  alt="Feuille analysée"
                                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                />
                              )}
                              <div>
                                {a.disease_info.description && (
                                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem', marginBottom: '0.85rem' }}>
                                    {a.disease_info.description}
                                  </p>
                                )}
                                {a.disease_info.symptoms && (
                                  <div style={{ marginBottom: '0.85rem' }}>
                                    <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Symptômes observés :</h4>
                                    <p style={{ fontSize: '0.9rem', margin: 0 }}>{a.disease_info.symptoms}</p>
                                  </div>
                                )}
                                {a.disease_info.advice && (
                                  <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Traitement recommandé :</h4>
                                    <p style={{ fontSize: '0.9rem', margin: 0 }}>{a.disease_info.advice}</p>
                                  </div>
                                )}

                                {/* Bouton Smart Workflow : Créer une tâche de traitement */}
                                {!createdTaskIds[a.id] ? (
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleCreateTaskFromAnalysis(a)}
                                    disabled={creatingTaskForId === a.id}
                                    style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
                                  >
                                    <CalendarPlus size={17} />
                                    {creatingTaskForId === a.id
                                      ? 'Planification...'
                                      : isHealthy
                                        ? 'Planifier un contrôle de suivi'
                                        : 'Planifier le traitement dans Mes Tâches'}
                                  </button>
                                ) : (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                      <Check size={17} /> Tâche planifiée !
                                    </span>
                                    <Link to="/tasks" style={{ color: 'white', fontSize: '0.85rem', textDecoration: 'underline', fontWeight: 500 }}>
                                      Voir mes tâches →
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ margin: 0 }}>Paramètres du Compte</h2>

                {settingsMsg && (
                  <div className="glass-card animate-fade-in" style={{
                    padding: '1rem 1.25rem',
                    background: settingsMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    borderColor: settingsMsg.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                    color: settingsMsg.type === 'success' ? 'var(--color-primary)' : '#f87171',
                    fontWeight: 500,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{settingsMsg.text}</span>
                    <button onClick={() => setSettingsMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                  </div>
                )}

                <div className="grid grid-cols-2" style={{ alignItems: 'start' }}>
                  {/* Informations du profil */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <User size={22} color="var(--color-primary)" />
                      <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Informations du Profil</h3>
                    </div>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Nom d'utilisateur</label>
                        <input
                          style={inputStyle}
                          required
                          value={profileForm.username}
                          onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Adresse e-mail</label>
                        <input
                          style={inputStyle}
                          type="email"
                          required
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Rôle du compte</label>
                        <input
                          style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                          disabled
                          value={user?.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Agriculteur'}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={savingSettings} style={{ marginTop: '0.5rem' }}>
                        Enregistrer les modifications
                      </button>
                    </form>
                  </div>

                  {/* Changement de mot de passe */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <Lock size={22} color="var(--color-primary)" />
                      <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Sécurité & Mot de passe</h3>
                    </div>
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Mot de passe actuel</label>
                        <input
                          style={inputStyle}
                          type="password"
                          required
                          placeholder="••••••••"
                          value={passwordForm.current_password}
                          onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Nouveau mot de passe</label>
                        <input
                          style={inputStyle}
                          type="password"
                          required
                          minLength={6}
                          placeholder="Au moins 6 caractères"
                          value={passwordForm.new_password}
                          onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Confirmer le nouveau mot de passe</label>
                        <input
                          style={inputStyle}
                          type="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={passwordForm.confirm_password}
                          onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn btn-outline" disabled={savingSettings} style={{ marginTop: '0.5rem' }}>
                        Mettre à jour le mot de passe
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </main>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
