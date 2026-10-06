import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Calendar, Loader, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', culture: '', status: 'PENDING' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, culturesRes] = await Promise.all([
        api.get('tasks/'),
        api.get('cultures/')
      ]);
      setTasks(tasksRes.data);
      setCultures(culturesRes.data);
    } catch (err) {
      if (err.response && err.response.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newTask };
      if (!payload.culture) delete payload.culture; // Allow null
      if (!payload.due_date) delete payload.due_date;
      const res = await api.post('tasks/', payload);
      setTasks([res.data, ...tasks]);
      setShowAddModal(false);
      setNewTask({ title: '', description: '', due_date: '', culture: '', status: 'PENDING' });
    } catch (err) {
      alert("Erreur lors de l'ajout de la tâche");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try {
      await api.delete(`tasks/${id}/`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await api.put(`tasks/${task.id}/`, { ...task, status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      alert("Erreur lors de la mise à jour");
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
          <CheckSquare size={32} color="var(--color-primary)" /> Mes Tâches
        </h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Nouvelle Tâche
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {tasks.map(task => (
          <div key={task.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: task.status === 'COMPLETED' ? '4px solid var(--color-primary)' : '4px solid #f59e0b' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none', color: task.status === 'COMPLETED' ? 'var(--color-text-muted)' : 'white' }}>{task.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{task.description}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <Calendar size={16} /> {task.due_date || 'Pas de date'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <select 
                value={task.status} 
                onChange={(e) => handleStatusChange(task, e.target.value)}
                style={{ background: 'transparent', color: 'white', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
              >
                <option value="PENDING" style={{color: 'black'}}>En attente</option>
                <option value="IN_PROGRESS" style={{color: 'black'}}>En cours</option>
                <option value="COMPLETED" style={{color: 'black'}}>Terminé</option>
              </select>
              <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p style={{ color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>Aucune tâche trouvée.</p>}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nouvelle Tâche</h2>
            <form onSubmit={handleAddTask}>
              <input style={inputStyle} placeholder="Titre de la tâche" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea style={{...inputStyle, minHeight: '100px'}} placeholder="Description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              <input style={inputStyle} type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
              <select style={inputStyle} value={newTask.culture} onChange={e => setNewTask({...newTask, culture: e.target.value})}>
                <option value="">-- Lié à une culture ? (Optionnel) --</option>
                {cultures.map(c => <option key={c.id} value={c.id} style={{color: 'black'}}>{c.name} ({c.plant_type})</option>)}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
