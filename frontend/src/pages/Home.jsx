import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Leaf, Activity, CheckCircle, ChevronRight, AlertTriangle, CalendarPlus, Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import api from '../services/api';

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cultures, setCultures] = useState([]);
  const [selectedCultureId, setSelectedCultureId] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Charger les cultures de l'utilisateur s'il est connecté
  useEffect(() => {
    if (isAuthenticated()) {
      const preselectedCulture = searchParams.get('culture');
      api.get('cultures/').then(res => {
        setCultures(res.data);
        if (preselectedCulture && res.data.some(c => String(c.id) === String(preselectedCulture))) {
          setSelectedCultureId(String(preselectedCulture));
        } else if (res.data.length > 0) {
          setSelectedCultureId(String(res.data[0].id));
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setTaskCreated(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setTaskCreated(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!isAuthenticated()) {
      alert("Veuillez vous connecter pour lancer une analyse.");
      navigate('/login');
      return;
    }

    if (!selectedCultureId) {
      alert("Veuillez d'abord créer une culture dans votre Dashboard et la sélectionner.");
      navigate('/dashboard');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setTaskCreated(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('culture', selectedCultureId);

      const response = await api.post('analyses/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const analysis = response.data;
      setResult({
        name: analysis.disease_info?.name || "Résultat non disponible",
        confidence: Math.round((analysis.confidence || 0) * 100),
        description: analysis.disease_info?.description || '',
        symptoms: analysis.disease_info?.symptoms || '',
        advice: analysis.disease_info?.advice || '',
        isHealthy: analysis.disease_info?.name?.toLowerCase().includes('healthy')
      });
    } catch (err) {
      alert("Erreur lors de l'analyse. Vérifiez que le serveur Django est démarré.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTreatmentTask = async () => {
    if (!result || !selectedCultureId || creatingTask || taskCreated) return;
    setCreatingTask(true);
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const cultureLabel = selectedCulture ? `${selectedCulture.name} (${selectedCulture.plant_type})` : 'Culture';
      const title = result.isHealthy
        ? `Contrôle sanitaire de suivi — ${cultureLabel}`
        : `Traitement : ${result.name} — ${cultureLabel}`;
      const description = result.advice
        ? `Diagnostic IA (${result.confidence}% de confiance) : ${result.name}.\nTraitement recommandé : ${result.advice}`
        : `Diagnostic IA (${result.confidence}% de confiance) : ${result.description}`;

      await api.post('tasks/', {
        title,
        description,
        culture: Number(selectedCultureId),
        due_date: tomorrow,
        status: 'PENDING'
      });
      setTaskCreated(true);
    } catch {
      alert("Erreur lors de la création automatique de la tâche.");
    } finally {
      setCreatingTask(false);
    }
  };

  const resultColor = result?.isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.05)';
  const resultBorder = result?.isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)';
  const resultTextColor = result?.isHealthy ? 'var(--color-primary)' : '#f87171';

  const selectedCulture = cultures.find(c => String(c.id) === selectedCultureId);

  return (
    <div className="container">
      <nav className="navbar animate-fade-in">
        <Link to="/" className="logo"><Leaf size={28} />Agri<span>Vision</span></Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/diseases" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Maladies</Link>
          {isAuthenticated() ? (
            <Link to="/dashboard" className="btn btn-primary">Mon Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Connexion</Link>
              <Link to="/login" className="btn btn-primary">S'inscrire</Link>
            </>
          )}
        </div>
      </nav>

      <main className="grid grid-cols-2" style={{ gap: '3rem', alignItems: 'center', paddingBottom: '4rem' }}>
        {/* Côté gauche : Hero */}
        <div className="animate-fade-in delay-1">
          <h1>Protégez vos cultures.</h1>
          <p style={{ marginBottom: '2.5rem', fontSize: '1.1rem' }}>
            Détectez instantanément les maladies de vos plantes grâce à notre modèle de vision par ordinateur.
            Obtenez un diagnostic précis et les meilleurs conseils pour sauver vos récoltes.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[{ Icon: CheckCircle }, { Icon: Activity }, { Icon: Leaf }].map(({ Icon }, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.875rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}>
                  <Icon size={24} color="var(--color-primary)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Côté droit : Analyseur */}
        <div className="glass-card animate-fade-in delay-2">
          <h2>Analyseur</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Sélectionnez ou glissez une photo de feuille.
          </p>

          {/* Sélecteur de culture (si connecté et cultures disponibles) */}
          {isAuthenticated() && cultures.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                🌱 Quelle culture analysez-vous ?
              </label>
              <select
                value={selectedCultureId}
                onChange={e => setSelectedCultureId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.06)', color: 'white', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', cursor: 'pointer' }}
              >
                {cultures.map(c => (
                  <option key={c.id} value={String(c.id)} style={{ background: '#0a0e17' }}>
                    {c.name} — {c.plant_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!preview ? (
            <div
              className={`uploader-area ${isDragOver ? 'active' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadCloud size={48} className="icon-large" />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Uploader une photo</h3>
              <p>Glissez-déposez ou cliquez pour parcourir</p>
            </div>
          ) : (
            <div style={{ marginBottom: '1.5rem', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img src={preview} alt="Aperçu" style={{ width: '100%', height: '230px', objectFit: 'cover' }} />
              <button onClick={() => { setPreview(null); setSelectedFile(null); setResult(null); }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem' }}>
                ✕
              </button>
              {selectedCulture && (
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem', color: 'white' }}>
                  🌱 {selectedCulture.name} — {selectedCulture.plant_type}
                </div>
              )}
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

          {!result && (
            <button className="btn btn-primary" style={{ width: '100%' }}
              disabled={!selectedFile || isAnalyzing || !selectedCultureId} onClick={handleAnalyze}>
              {isAnalyzing ? 'Analyse en cours...' : (<>Lancer l'analyse <ChevronRight size={18} /></>)}
            </button>
          )}

          {/* Résultat */}
          {result && (
            <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.5rem', background: resultColor, border: `1px solid ${resultBorder}`, borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: resultTextColor }}>
                  {result.isHealthy ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{result.name}</h3>
                </div>
                <span style={{ background: resultTextColor, color: result.isHealthy ? '#022c22' : '#450a0a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {result.confidence}%
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', fontSize: '0.9rem' }}>{result.description}</p>
              {result.symptoms && <><h4 style={{ color: 'var(--color-secondary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Symptômes :</h4><p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{result.symptoms}</p></>}
              {result.advice && <><h4 style={{ color: 'var(--color-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Traitement recommandé :</h4><p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{result.advice}</p></>}
              
              {/* Smart Workflow : Planifier automatiquement une tâche liée à cette culture */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
                {!taskCreated ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.95rem' }}
                    disabled={creatingTask}
                    onClick={handleCreateTreatmentTask}
                  >
                    <CalendarPlus size={18} />
                    {creatingTask
                      ? 'Planification...'
                      : result.isHealthy
                        ? 'Planifier un contrôle de suivi'
                        : 'Planifier le traitement dans Mes Tâches'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      <Check size={18} /> Tâche ajoutée !
                    </span>
                    <Link to="/tasks" style={{ color: 'white', textDecoration: 'underline', fontWeight: 500, fontSize: '0.85rem' }}>
                      Voir mes tâches →
                    </Link>
                  </div>
                )}

                <button className="btn btn-outline" style={{ width: '100%', padding: '0.6rem' }}
                  onClick={() => { setPreview(null); setSelectedFile(null); setResult(null); setTaskCreated(false); }}>
                  Nouvelle analyse
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;
