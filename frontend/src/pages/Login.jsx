import React, { useState } from 'react';
import { Leaf, User, Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../services/auth';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Connexion réelle via le backend Django JWT
        await login(formData.username, formData.password);
      } else {
        // Inscription, puis connexion automatique
        await register(formData.username, formData.email, formData.password);
        await login(formData.username, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      // Affiche le message d'erreur retourné par le backend (ex: mauvais mot de passe)
      setError(err.response?.data?.detail || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '1rem 1rem 1rem 3rem',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.04)', color: 'white', outline: 'none',
    fontFamily: 'inherit', fontSize: '1rem', transition: 'all 0.2s'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* Logo en haut */}
      <Link to="/" className="logo" style={{ marginBottom: '2rem', fontSize: '1.75rem' }}>
        <Leaf size={32} />
        Agri<span>Vision</span>
      </Link>

      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Tabs connexion / inscription */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <button onClick={() => setIsLogin(true)}
            style={{ flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600, color: isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)', borderBottom: isLogin ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 0.2s' }}>
            Se connecter
          </button>
          <button onClick={() => setIsLogin(false)}
            style={{ flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600, color: !isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)', borderBottom: !isLogin ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 0.2s' }}>
            S'inscrire
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Champ nom d'utilisateur */}
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', pointerEvents: 'none' }} />
            <input type="text" placeholder="Nom d'utilisateur" required style={inputStyle}
              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>

          {/* Champ email (inscription seulement) */}
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', pointerEvents: 'none' }} />
              <input type="email" placeholder="Adresse email" required style={{ ...inputStyle, paddingLeft: '3rem' }}
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          )}

          {/* Champ mot de passe */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', pointerEvents: 'none' }} />
            <input type="password" placeholder="Mot de passe" required style={inputStyle}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "Créer le compte")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
