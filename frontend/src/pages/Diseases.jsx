import React, { useState, useEffect } from 'react';
import { Leaf, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { isAuthenticated } from '../services/auth';

// Mapping couleur par plante pour les badges
const PLANT_COLORS = {
  'Tomate': '#ef4444',
  'Pomme': '#f97316',
  'Pomme de terre': '#a16207',
  'Raisin': '#7c3aed',
  'Maïs': '#eab308',
  'Pêche': '#f43f5e',
  'Poivron': '#84cc16',
  'Fraise': '#ec4899',
  'Cerise': '#dc2626',
  'Myrtille': '#3b82f6',
  'Orange': '#f97316',
  'Framboise': '#db2777',
  'Soja': '#65a30d',
  'Courge': '#d97706',
};

function DiseaseBadge({ plant }) {
  const color = PLANT_COLORS[plant] || '#10b981';
  return (
    <span style={{
      padding: '0.2rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem',
      fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44`
    }}>
      {plant}
    </span>
  );
}

function DiseaseCard({ disease }) {
  const [expanded, setExpanded] = useState(false);
  const isHealthy = disease.name.toLowerCase().includes('healthy');

  return (
    <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            {disease.name}
          </h3>
          <DiseaseBadge plant={disease.plant} />
        </div>
        <span style={{
          background: isHealthy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: isHealthy ? 'var(--color-primary)' : '#f87171',
          padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '1rem'
        }}>
          {isHealthy ? '✓ Saine' : '⚠ Maladie'}
        </span>
      </div>

      <p style={{ fontSize: '0.9rem', marginBottom: expanded ? '1rem' : 0,
        display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {disease.description}
      </p>

      {expanded && (
        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          {disease.symptoms && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#0ea5e9', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Symptômes</h4>
              <p style={{ fontSize: '0.85rem' }}>{disease.symptoms}</p>
            </div>
          )}
          {disease.advice && (
            <div>
              <h4 style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Traitement & Conseils</h4>
              <p style={{ fontSize: '0.85rem' }}>{disease.advice}</p>
            </div>
          )}
        </div>
      )}

      <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginTop: '0.75rem', fontWeight: 500 }}>
        {expanded ? '▲ Réduire' : '▼ Voir les détails'}
      </p>
    </div>
  );
}

function Diseases() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlant, setFilterPlant] = useState('');

  useEffect(() => {
    api.get('diseases/').then(res => {
      setDiseases(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const plants = [...new Set(diseases.map(d => d.plant))].sort();

  const filtered = diseases.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                        d.plant.toLowerCase().includes(search.toLowerCase()) ||
                        d.description.toLowerCase().includes(search.toLowerCase());
    const matchPlant = filterPlant ? d.plant === filterPlant : true;
    return matchSearch && matchPlant;
  });

  return (
    <div className="container">
      <nav className="navbar animate-fade-in">
        <Link to="/" className="logo"><Leaf size={28} />Agri<span>Vision</span></Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAuthenticated()
            ? <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
            : <><Link to="/login" className="btn btn-outline">Connexion</Link><Link to="/login" className="btn btn-primary">S'inscrire</Link></>
          }
        </div>
      </nav>

      {/* Header */}
      <div className="animate-fade-in delay-1" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="badge">Encyclopédie des Maladies</span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>38 Classes détectées par l'IA</h1>
        <p>Explorez toutes les maladies et états de santé que notre modèle peut identifier sur <strong style={{ color: 'white' }}>14 plantes différentes</strong>.</p>
      </div>

      {/* Filtres */}
      <div className="animate-fade-in delay-2" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Rechercher une maladie ou plante..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', borderRadius: '100px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={16} /></button>}
        </div>
        <select value={filterPlant} onChange={e => setFilterPlant(e.target.value)}
          style={{ padding: '0.875rem 1.5rem', borderRadius: '100px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', cursor: 'pointer' }}>
          <option value="" style={{ background: '#0a0e17' }}>Toutes les plantes</option>
          {plants.map(p => <option key={p} value={p} style={{ background: '#0a0e17' }}>{p}</option>)}
        </select>
      </div>

      {/* Compteur */}
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <span style={{ color: 'white', fontWeight: 600 }}>{filtered.length}</span> résultats trouvés
      </p>

      {/* Grille des maladies */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><p>Chargement...</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {filtered.map(d => <DiseaseCard key={`${d.plant}-${d.name}`} disease={d} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
              <p>Aucune maladie trouvée pour cette recherche.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Diseases;
