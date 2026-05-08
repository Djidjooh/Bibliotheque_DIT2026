import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LIVRES_URL      = process.env.REACT_APP_SERVICE_LIVRES      || 'http://localhost:3001';
const EMPRUNTS_URL    = process.env.REACT_APP_SERVICE_EMPRUNTS    || 'http://localhost:3003';
const RECO_URL        = process.env.REACT_APP_SERVICE_RECO        || 'http://localhost:3004';

export default function App() {
  const [livres,  setLivres]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [recos,   setRecos]   = useState([]);
  const [userId,  setUserId]  = useState('u001');
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('livres');

  useEffect(() => {
    axios.get(`${LIVRES_URL}/api/livres`)
      .then(r => setLivres(r.data.livres || []))
      .catch(() => {});
    axios.get(`${EMPRUNTS_URL}/api/emprunts/stats`)
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const getRecommandations = () => {
    setLoading(true);
    axios.get(`${RECO_URL}/api/recommendations/${userId}?top_k=5`)
      .then(r => setRecos(r.data.recommandations || []))
      .catch(() => setRecos([]))
      .finally(() => setLoading(false));
  };

  const styles = {
    app:    { fontFamily: 'Arial', maxWidth: 900, margin: '0 auto', padding: 20 },
    header: { background: '#1a237e', color: 'white', padding: '16px 24px', borderRadius: 8, marginBottom: 20 },
    tabs:   { display: 'flex', gap: 8, marginBottom: 20 },
    tab:    { padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#e0e0e0' },
    active: { background: '#1a237e', color: 'white' },
    card:   { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 },
    stat:   { display: 'inline-block', background: '#e8eaf6', borderRadius: 8, padding: '12px 24px', margin: 8, textAlign: 'center' },
    input:  { padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', marginRight: 8, width: 220 },
    btn:    { padding: '8px 20px', background: '#1a237e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' },
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={{margin:0}}>Bibliotheque Numerique — DIT</h1>
        <p style={{margin:'4px 0 0', opacity:0.8}}>Master 2 Intelligence Artificielle</p>
      </div>

      <div style={styles.tabs}>
        {['livres','stats','recommandations'].map(t => (
          <button key={t} style={{...styles.tab, ...(tab===t ? styles.active : {})}}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'livres' && (
        <div>
          <h2>Catalogue ({livres.length} livres)</h2>
          {livres.length === 0 && <p style={{color:'#888'}}>Chargement ou service indisponible...</p>}
          {livres.map((l, i) => (
            <div key={i} style={styles.card}>
              <strong>{l.titre}</strong>
              <p style={{margin:'4px 0', color:'#555'}}>{l.auteur} — {l.categorie}</p>
              <span style={{fontSize:12, color: l.exemplaires_disponibles > 0 ? 'green' : 'red'}}>
                {l.exemplaires_disponibles > 0
                  ? `${l.exemplaires_disponibles} exemplaire(s) disponible(s)`
                  : 'Indisponible'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <h2>Statistiques des emprunts</h2>
          {stats ? (
            <div>
              <div style={styles.stat}><div style={{fontSize:28, fontWeight:'bold', color:'#1a237e'}}>{stats.total}</div><div>Total</div></div>
              <div style={styles.stat}><div style={{fontSize:28, fontWeight:'bold', color:'green'}}>{stats.en_cours}</div><div>En cours</div></div>
              <div style={styles.stat}><div style={{fontSize:28, fontWeight:'bold', color:'gray'}}>{stats.retournes}</div><div>Retournés</div></div>
              <div style={styles.stat}><div style={{fontSize:28, fontWeight:'bold', color:'red'}}>{stats.en_retard}</div><div>En retard</div></div>
            </div>
          ) : (
            <p style={{color:'#888'}}>Chargement ou service indisponible...</p>
          )}
        </div>
      )}

      {tab === 'recommandations' && (
        <div>
          <h2>Recommandations personnalisées</h2>
          <div style={{marginBottom:16}}>
            <input
              style={styles.input}
              placeholder="ID utilisateur (ex: u001)"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
            <button style={styles.btn} onClick={getRecommandations} disabled={loading}>
              {loading ? 'Chargement...' : 'Obtenir des recommandations'}
            </button>
          </div>
          {recos.length === 0 && !loading && (
            <p style={{color:'#888'}}>Entrez un ID utilisateur et cliquez sur le bouton.</p>
          )}
          {recos.map((r, i) => (
            <div key={i} style={styles.card}>
              <strong>Livre ID : {r.book_id}</strong>
              <p style={{margin:'4px 0'}}>
                Score de recommandation :
                <span style={{color:'#1a237e', fontWeight:'bold'}}> {r.score}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
