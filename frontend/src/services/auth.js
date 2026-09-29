// services/auth.js
// Ce fichier gère toute la logique d'authentification :
// connexion, inscription, stockage des tokens JWT, et déconnexion.
import api from './api';

// Connexion : envoie username + password, récupère les tokens JWT
export const login = async (username, password) => {
    const response = await api.post('token/', { username, password });
    const { access, refresh } = response.data;
    // On stocke les tokens dans localStorage pour les sessions persistantes
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
};

// Inscription : crée un nouveau compte utilisateur
export const register = async (username, email, password) => {
    const response = await api.post('users/', { username, email, password, role: 'AGRICULTEUR' });
    return response.data;
};

// Récupérer le profil de l'utilisateur connecté
export const getMyProfile = async () => {
    const response = await api.get('users/me/');
    return response.data;
};

// Déconnexion : supprime les tokens du localStorage
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
};
