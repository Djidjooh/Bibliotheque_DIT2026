import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const LIVRES_URL   = process.env.REACT_APP_SERVICE_LIVRES       || 'http://localhost:3001';
const USERS_URL    = process.env.REACT_APP_SERVICE_UTILISATEURS  || 'http://localhost:3002';
const EMPRUNTS_URL = process.env.REACT_APP_SERVICE_EMPRUNTS     || 'http://localhost:3003';
const RECO_URL     = process.env.REACT_APP_SERVICE_RECO         || 'http://localhost:3004';

const LIMIT = 20;

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  primary: '#1a237e', accent: '#3949ab', success: '#2e7d32',
  danger:  '#c62828', warn:   '#e65100', gray:    '#546e7a',
  light:   '#f5f7ff', border: '#dde3f0',
};

const S = {
  card:     { border:`1px solid ${C.border}`, borderRadius:8, padding:16, marginBottom:10, background:'#fff' },
  input:    { padding:'9px 12px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:14, width:'100%', boxSizing:'border-box' },
  btn:      { padding:'9px 18px', background:C.primary, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14 },
  btnSm:    { padding:'5px 11px', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 },
  btnDanger:{ padding:'5px 11px', background:'#ffebee', color:C.danger, border:'none', borderRadius:5, cursor:'pointer', fontSize:12 },
  btnEdit:  { padding:'5px 11px', background:'#e3f2fd', color:'#1565c0', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 },
  badge:    { fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:'bold', display:'inline-block' },
  th:       { background:C.light, padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:13, borderBottom:`1px solid ${C.border}` },
  td:       { padding:'9px 12px', fontSize:13, borderBottom:`1px solid ${C.border}` },
  table:    { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:8, overflow:'hidden', border:`1px solid ${C.border}` },
  section:  { marginBottom:28 },
  label:    { fontSize:13, fontWeight:600, display:'block', marginBottom:4 },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' },
  statCard: { background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 24px', textAlign:'center', flex:1, minWidth:130 },
};

const statutBadge = (s) => {
  const cfg = {
    en_cours: {bg:'#e3f2fd',color:'#1565c0',label:'En cours'},
    retourne: {bg:'#e8f5e9',color:C.success,label:'Retourné'},
    en_retard:{bg:'#ffebee',color:C.danger, label:'En retard'},
  };
  const c = cfg[s] || {bg:'#f0f0f0',color:'#333',label:s};
  return <span style={{...S.badge, background:c.bg, color:c.color}}>{c.label}</span>;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── Page d'accueil / Auth ──────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode,  setMode]  = useState('login'); // 'login' | 'register'
  const [form,  setForm]  = useState({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'register') {
        await axios.post(`${USERS_URL}/api/auth/register`, form);
        setMode('login');
        setErr('Compte créé ! Connectez-vous maintenant.');
      } else {
        const { data } = await axios.post(`${USERS_URL}/api/auth/login`, {
          email: form.email, mot_de_passe: form.mot_de_passe,
        });
        onLogin({ ...data.utilisateur, token: data.token });
      }
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Une erreur est survenue.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:420, background:'#fff', borderRadius:12, boxShadow:'0 4px 24px #0002', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:C.primary, padding:'28px 32px', color:'#fff' }}>
          <h1 style={{ margin:0, fontSize:22 }}>Bibliothèque Numérique</h1>
          <p style={{ margin:'6px 0 0', opacity:.8, fontSize:13 }}>DIT — Master 2 Intelligence Artificielle</p>
        </div>

        {/* Tabs login / inscription */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
          {[['login','Connexion'],['register','Inscription']].map(([key,label]) => (
            <button key={key} onClick={() => { setMode(key); setErr(''); }}
              style={{ flex:1, padding:'14px', border:'none', cursor:'pointer', fontSize:14, fontWeight:600,
                background: mode===key ? '#fff' : C.light,
                color: mode===key ? C.primary : C.gray,
                borderBottom: mode===key ? `3px solid ${C.primary}` : '3px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ padding:'24px 32px' }}>
          {mode === 'register' && (
            <>
              <div style={S.formGrid}>
                <div>
                  <label style={S.label}>Prénom</label>
                  <input style={S.input} value={form.prenom} onChange={set('prenom')} required placeholder="Votre prénom" />
                </div>
                <div>
                  <label style={S.label}>Nom</label>
                  <input style={S.input} value={form.nom} onChange={set('nom')} required placeholder="Votre nom" />
                </div>
              </div>
              <div style={{ marginTop:12 }}>
                <label style={S.label}>Type de compte</label>
                <select style={S.input} value={form.type_utilisateur} onChange={set('type_utilisateur')}>
                  <option value="etudiant">Étudiant</option>
                  <option value="professeur">Professeur</option>
                  <option value="personnel">Personnel</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginTop:12 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={form.email} onChange={set('email')}
              required placeholder="votre@email.sn" autoComplete="email" />
          </div>
          <div style={{ marginTop:12, marginBottom:20 }}>
            <label style={S.label}>Mot de passe</label>
            <input style={S.input} type="password" value={form.mot_de_passe} onChange={set('mot_de_passe')}
              required placeholder="••••••••" autoComplete={mode==='login'?'current-password':'new-password'} />
          </div>

          {err && (
            <div style={{ padding:'10px 12px', borderRadius:6, marginBottom:14, fontSize:13,
              background: err.startsWith('Compte') ? '#e8f5e9' : '#ffebee',
              color:      err.startsWith('Compte') ? C.success  : C.danger }}>
              {err}
            </div>
          )}

          <button type="submit" style={{ ...S.btn, width:'100%', padding:'11px' }} disabled={busy}>
            {busy ? 'Chargement...' : mode==='login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          {mode === 'login' && (
            <p style={{ marginTop:12, fontSize:12, color:'#888', textAlign:'center' }}>
              Gestionnaire : <strong>admin@dit.sn</strong> / <strong>admin2026</strong>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Composant principal (utilisateur connecté) ──────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(null);

  const handleLogin  = (user) => setAuthUser(user);
  const handleLogout = () => { setAuthUser(null); };

  if (!authUser) return <AuthPage onLogin={handleLogin} />;

  return authUser.type_utilisateur === 'personnel'
    ? <AdminApp  user={authUser} onLogout={handleLogout} />
    : <UserApp   user={authUser} onLogout={handleLogout} />;
}

// ════════════════════════════════════════════════════════════════════════════
// ── VUE UTILISATEUR (étudiant / professeur) ─────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function UserApp({ user, onLogout }) {
  const [tab,       setTab]       = useState('catalogue');
  const [livres,    setLivres]    = useState([]);
  const [totalLivres, setTotalLivres] = useState(0);
  const [searchQ,   setSearchQ]   = useState('');
  const [dispOnly,  setDispOnly]  = useState(false);
  const [catPage,   setCatPage]   = useState(1);
  const [recos,     setRecos]     = useState([]);
  const [recoLoad,  setRecoLoad]  = useState(false);
  const [recoErr,   setRecoErr]   = useState('');

  const fetchCatalogue = useCallback(() => {
    if (searchQ.trim() && dispOnly) {
      axios.get(`${LIVRES_URL}/api/livres/disponibles`)
        .then(r => {
          const res = (r.data.livres||[]).filter(l =>
            l.titre.toLowerCase().includes(searchQ.toLowerCase()) ||
            l.auteur.toLowerCase().includes(searchQ.toLowerCase()));
          setLivres(res); setTotalLivres(res.length);
        }).catch(()=>{});
    } else if (searchQ.trim()) {
      axios.get(`${LIVRES_URL}/api/livres/search?q=${encodeURIComponent(searchQ)}`)
        .then(r => { setLivres(r.data.livres||[]); setTotalLivres((r.data.livres||[]).length); })
        .catch(()=>{});
    } else if (dispOnly) {
      axios.get(`${LIVRES_URL}/api/livres/disponibles`)
        .then(r => { setLivres(r.data.livres||[]); setTotalLivres((r.data.livres||[]).length); })
        .catch(()=>{});
    } else {
      axios.get(`${LIVRES_URL}/api/livres?page=${catPage}&limit=${LIMIT}`)
        .then(r => { setLivres(r.data.livres||[]); setTotalLivres(r.data.total||0); })
        .catch(()=>{});
    }
  }, [searchQ, dispOnly, catPage]);

  useEffect(() => { fetchCatalogue(); }, [fetchCatalogue]);

  const getRecos = useCallback(() => {
    setRecoLoad(true); setRecoErr('');
    axios.get(`${RECO_URL}/api/recommendations/${user.id}?top_k=10`)
      .then(r => setRecos(r.data.recommandations||[]))
      .catch(e => {
        const msg = e.response?.data?.detail || 'Service indisponible.';
        setRecoErr(msg);
        setRecos([]);
      })
      .finally(() => setRecoLoad(false));
  }, [user.id]);

  useEffect(() => { if (tab==='recommandations') getRecos(); }, [tab, getRecos]);

  const catTotalPages = Math.ceil(totalLivres / LIMIT);

  return (
    <div style={{ fontFamily:'Arial, sans-serif', maxWidth:1000, margin:'0 auto', padding:20 }}>
      {/* Header */}
      <div style={{ background:C.primary, color:'#fff', padding:'14px 24px', borderRadius:8, marginBottom:20,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <strong style={{ fontSize:18 }}>Bibliothèque Numérique — DIT</strong>
          <span style={{ marginLeft:12, fontSize:12, opacity:.8 }}>Master 2 IA</span>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:13 }}>{user.prenom} {user.nom}</span>
          <span style={{ ...S.badge, background:'#ffffff20', color:'#fff', marginLeft:8 }}>{user.type_utilisateur}</span>
          {user.model_id && (
            <span style={{ ...S.badge, background:'#ffffff15', color:'#ffffffcc', marginLeft:6, fontSize:10 }}>
              ID: {user.model_id}
            </span>
          )}
          <br/>
          <button onClick={onLogout}
            style={{ ...S.btnSm, marginTop:4, background:'#ffffff20', color:'#fff', border:'1px solid #fff4' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          ['catalogue',       'Catalogue de livres'],
          ['recommandations', 'Mes recommandations'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'9px 20px', border:'none', borderRadius:6, cursor:'pointer', fontSize:13,
              background: tab===key ? C.primary : '#e0e0e0',
              color:      tab===key ? '#fff' : '#333' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CATALOGUE ────────────────────────────────────────────────────── */}
      {tab === 'catalogue' && (
        <div>
          <h2 style={{ marginBottom:14 }}>
            Catalogue
            <span style={{ fontSize:14, color:'#777', fontWeight:'normal', marginLeft:10 }}>
              {(searchQ||dispOnly) ? `${livres.length} résultat(s)` : `${totalLivres} livres`}
            </span>
          </h2>

          <form onSubmit={e=>{e.preventDefault(); setCatPage(1); fetchCatalogue();}}
            style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input style={{ ...S.input, width:320 }} placeholder="Rechercher par titre, auteur ou ISBN..."
              value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            <button type="submit" style={S.btn}>Rechercher</button>
            {searchQ && (
              <button type="button" style={{ ...S.btn, background:C.gray }}
                onClick={() => { setSearchQ(''); setCatPage(1); }}>Effacer</button>
            )}
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
              <input type="checkbox" checked={dispOnly}
                onChange={e => { setDispOnly(e.target.checked); setCatPage(1); }} />
              Disponibles uniquement
            </label>
          </form>

          {livres.length === 0 && <p style={{ color:'#888' }}>Aucun résultat.</p>}

          {livres.map((l, i) => (
            <div key={l.id||i} style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <strong style={{ fontSize:15 }}>{l.titre}</strong>
                <p style={{ margin:'4px 0 2px', color:'#555', fontSize:13 }}>{l.auteur}</p>
                <p style={{ margin:0, color:'#888', fontSize:12 }}>
                  {l.categorie}{l.annee_publication ? ` — ${l.annee_publication}` : ''}
                </p>
              </div>
              <span style={{ ...S.badge, marginLeft:16, whiteSpace:'nowrap',
                background: l.exemplaires_disponibles>0 ? '#e8f5e9' : '#ffebee',
                color:      l.exemplaires_disponibles>0 ? C.success  : C.danger }}>
                {l.exemplaires_disponibles>0 ? `${l.exemplaires_disponibles} dispo.` : 'Indisponible'}
              </span>
            </div>
          ))}

          {!(searchQ||dispOnly) && catTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
              <button style={{ ...S.btn, background:catPage===1?'#ccc':C.primary }}
                disabled={catPage===1} onClick={() => setCatPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'36px', fontSize:13 }}>Page {catPage} / {catTotalPages}</span>
              <button style={{ ...S.btn, background:catPage===catTotalPages?'#ccc':C.primary }}
                disabled={catPage===catTotalPages} onClick={() => setCatPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ── RECOMMANDATIONS ──────────────────────────────────────────────── */}
      {tab === 'recommandations' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ margin:0 }}>Recommandations personnalisées</h2>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#777' }}>
                Basées sur votre profil de lecture — identifiant modèle :
                <strong style={{ color:C.primary, marginLeft:4 }}>{user.model_id || '(non attribué)'}</strong>
              </p>
            </div>
            <button style={S.btn} onClick={getRecos} disabled={recoLoad}>
              {recoLoad ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>

          {recoErr && (
            <div style={{ padding:'12px 16px', borderRadius:8, background:'#fff3e0', color:C.warn,
              border:`1px solid #ffe0b2`, marginBottom:16, fontSize:13 }}>
              {user.model_id
                ? `⚠ ${recoErr} — Votre compte (${user.model_id}) n'a pas encore assez d'historique.`
                : '⚠ Votre compte ne dispose pas encore d\'un identifiant modèle.'}
            </div>
          )}

          {recoLoad && <p style={{ color:'#888' }}>Calcul des recommandations en cours...</p>}

          {!recoLoad && recos.length > 0 && (
            <>
              <p style={{ fontSize:13, color:'#666', marginBottom:12 }}>
                {recos.length} livre(s) sélectionné(s) rien que pour vous :
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
                {recos.map((r, i) => (
                  <div key={i} style={{ ...S.card, borderTop:`3px solid ${C.accent}`, position:'relative' }}>
                    <div style={{ position:'absolute', top:12, right:12,
                      ...S.badge, background:'#e8eaf6', color:C.primary }}>
                      ★ {r.score}
                    </div>
                    <p style={{ fontSize:11, color:C.gray, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>
                      {r.categorie}
                    </p>
                    <strong style={{ fontSize:14, display:'block', marginBottom:4, paddingRight:48 }}>
                      {r.titre || r.book_id}
                    </strong>
                    <p style={{ margin:'0 0 10px', color:'#666', fontSize:13 }}>{r.auteur}</p>
                    <span style={{ ...S.badge,
                      background: r.exemplaires_disponibles>0 ? '#e8f5e9' : '#ffebee',
                      color:      r.exemplaires_disponibles>0 ? C.success  : C.danger }}>
                      {r.exemplaires_disponibles>0
                        ? `${r.exemplaires_disponibles} exemplaire(s) dispo.`
                        : 'Indisponible'}
                    </span>
                    {r.annee_publication && (
                      <span style={{ fontSize:11, color:'#aaa', marginLeft:8 }}>{r.annee_publication}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── VUE ADMIN / GESTIONNAIRE ────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function AdminApp({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const authH = () => ({ Authorization: `Bearer ${user.token}` });

  // Dashboard
  const [dashboard, setDashboard] = useState(null);

  // Gestion livres
  const [gLivres, setGLivres]       = useState([]);
  const [gLivresTotal, setGLivresTotal] = useState(0);
  const [gLivresPage,  setGLivresPage]  = useState(1);
  const [showLivreForm, setShowLivreForm] = useState(false);
  const [editLivre, setEditLivre]   = useState(null);
  const [livreForm, setLivreForm]   = useState({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
  const [livreMsg,  setLivreMsg]    = useState('');

  // Gestion utilisateurs
  const [gUsers, setGUsers]         = useState([]);
  const [gUsersTotal, setGUsersTotal] = useState(0);
  const [gUsersPage,  setGUsersPage]  = useState(1);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm]     = useState({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
  const [userMsg,  setUserMsg]      = useState('');

  // Emprunts / utilisateur
  const [allUsers,    setAllUsers]    = useState([]);
  const [empUser,     setEmpUser]     = useState('');
  const [empHistory,  setEmpHistory]  = useState(null);

  // ── Dashboard ──────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(() => {
    axios.get(`${EMPRUNTS_URL}/api/admin/dashboard`, { headers: authH() })
      .then(r => setDashboard(r.data)).catch(()=>{});
  }, []); // eslint-disable-line
  useEffect(() => { if (tab==='dashboard') fetchDashboard(); }, [tab, fetchDashboard]);

  // ── Gestion livres ─────────────────────────────────────────────────────
  const fetchGLivres = useCallback(() => {
    axios.get(`${LIVRES_URL}/api/livres?page=${gLivresPage}&limit=${LIMIT}`)
      .then(r => { setGLivres(r.data.livres||[]); setGLivresTotal(r.data.total||0); }).catch(()=>{});
  }, [gLivresPage]);
  useEffect(() => { if (tab==='gestion-livres') fetchGLivres(); }, [tab, fetchGLivres]);

  const saveLivre = async () => {
    setLivreMsg('');
    try {
      if (editLivre) {
        await axios.put(`${LIVRES_URL}/api/livres/${editLivre.id}`, livreForm, { headers: authH() });
        setLivreMsg('Livre modifié avec succès.');
      } else {
        await axios.post(`${LIVRES_URL}/api/livres`, livreForm, { headers: authH() });
        setLivreMsg('Livre ajouté avec succès.');
      }
      setShowLivreForm(false); setEditLivre(null);
      setLivreForm({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
      fetchGLivres();
    } catch(e) { setLivreMsg(`Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const deleteLivre = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try {
      await axios.delete(`${LIVRES_URL}/api/livres/${id}`, { headers: authH() });
      setLivreMsg('Livre supprimé.'); fetchGLivres();
    } catch(e) { setLivreMsg(`Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const startEditLivre = (l) => {
    setEditLivre(l);
    setLivreForm({ titre:l.titre, auteur:l.auteur, isbn:l.isbn, categorie:l.categorie||'',
      editeur:l.editeur||'', annee_publication:l.annee_publication||'',
      nombre_exemplaires:l.nombre_exemplaires, description:l.description||'' });
    setShowLivreForm(true);
  };

  // ── Gestion utilisateurs ───────────────────────────────────────────────
  const fetchGUsers = useCallback(() => {
    axios.get(`${USERS_URL}/api/utilisateurs?limit=${LIMIT}&page=${gUsersPage}`, { headers: authH() })
      .then(r => { setGUsers(r.data.utilisateurs||[]); setGUsersTotal(r.data.total||0); }).catch(()=>{});
  }, [gUsersPage]); // eslint-disable-line
  useEffect(() => { if (tab==='gestion-utilisateurs') fetchGUsers(); }, [tab, fetchGUsers]);

  const saveUser = async () => {
    setUserMsg('');
    try {
      await axios.post(`${USERS_URL}/api/auth/register`, userForm);
      setUserMsg('Utilisateur ajouté avec succès.');
      setShowUserForm(false);
      setUserForm({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
      fetchGUsers();
    } catch(e) { setUserMsg(`Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const deleteUser = async (id, nom, prenom) => {
    if (!window.confirm(`Supprimer ${prenom} ${nom} ?`)) return;
    try {
      await axios.delete(`${USERS_URL}/api/utilisateurs/${id}`, { headers: authH() });
      setUserMsg('Utilisateur supprimé.'); fetchGUsers();
    } catch(e) { setUserMsg(`Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const toggleUser = async (id) => {
    try {
      await axios.patch(`${USERS_URL}/api/utilisateurs/${id}/toggle`, {}, { headers: authH() });
      fetchGUsers();
    } catch(e) {}
  };

  // ── Emprunts par utilisateur ───────────────────────────────────────────
  useEffect(() => {
    if (tab==='emprunts-user') {
      axios.get(`${USERS_URL}/api/utilisateurs?limit=100`, { headers: authH() })
        .then(r => setAllUsers(r.data.utilisateurs||[])).catch(()=>{});
    }
  }, [tab]); // eslint-disable-line

  const fetchEmpruntsUser = async () => {
    if (!empUser) return;
    try {
      const { data } = await axios.get(
        `${EMPRUNTS_URL}/api/admin/emprunts/utilisateur/${empUser}`,
        { headers: authH() }
      );
      setEmpHistory(data);
    } catch(e) { setEmpHistory(null); }
  };

  const gLivresTotalPages = Math.ceil(gLivresTotal / LIMIT);
  const gUsersTotalPages  = Math.ceil(gUsersTotal  / LIMIT);

  const adminTabs = [
    ['dashboard',           'Tableau de bord'],
    ['gestion-livres',      'Gestion Livres'],
    ['gestion-utilisateurs','Gestion Utilisateurs'],
    ['emprunts-user',       'Emprunts / Utilisateur'],
  ];

  return (
    <div style={{ fontFamily:'Arial, sans-serif', maxWidth:1100, margin:'0 auto', padding:20 }}>
      {/* Header */}
      <div style={{ background:C.primary, color:'#fff', padding:'14px 24px', borderRadius:8, marginBottom:20,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <strong style={{ fontSize:18 }}>Bibliothèque Numérique — DIT</strong>
          <span style={{ marginLeft:10, fontSize:12, opacity:.8 }}>Espace Gestionnaire</span>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:13 }}>{user.prenom} {user.nom}</span>
          <span style={{ ...S.badge, background:'#ffffff25', color:'#fff', marginLeft:8 }}>GESTIONNAIRE</span>
          <br/>
          <button onClick={onLogout}
            style={{ ...S.btnSm, marginTop:4, background:'#ffffff20', color:'#fff', border:'1px solid #fff4' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {adminTabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'9px 18px', border:'none', borderRadius:6, cursor:'pointer', fontSize:13,
              background: tab===key ? C.accent : '#e8eaf6',
              color:      tab===key ? '#fff'   : C.primary }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
      {tab==='dashboard' && (
        <div>
          <h2>Tableau de bord</h2>
          {!dashboard ? <p style={{ color:'#888' }}>Chargement...</p> : (<>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
              {[
                { val:dashboard.global.total_titres,           label:'Titres',            color:C.primary },
                { val:dashboard.global.total_exemplaires,      label:'Exemplaires',        color:C.accent },
                { val:dashboard.global.exemplaires_disponibles,label:'Disponibles',        color:C.success },
                { val:dashboard.global.total_utilisateurs,     label:'Utilisateurs',       color:'#6a1b9a' },
                { val:dashboard.global.emprunts_en_cours,      label:'Emprunts en cours',  color:'#1565c0' },
                { val:dashboard.global.emprunts_en_retard,     label:'En retard',          color:C.danger },
                { val:dashboard.global.total_emprunts,         label:'Total emprunts',     color:C.gray },
              ].map(({val,label,color}) => (
                <div key={label} style={{ ...S.statCard, minWidth:110 }}>
                  <div style={{ fontSize:26, fontWeight:'bold', color }}>{val||0}</div>
                  <div style={{ fontSize:11, color:'#777', marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Top livres */}
            <div style={S.section}>
              <h3 style={{ color:C.primary, marginBottom:12 }}>Livres les plus empruntés</h3>
              {dashboard.top_livres.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt enregistré.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>#</th><th style={S.th}>Titre</th><th style={S.th}>Auteur</th>
                      <th style={S.th}>Catégorie</th>
                      <th style={{...S.th,textAlign:'center'}}>Emprunts</th>
                      <th style={{...S.th,textAlign:'center'}}>Dispo.</th>
                    </tr></thead>
                    <tbody>
                      {dashboard.top_livres.map((l,i) => (
                        <tr key={i} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                          <td style={S.td}><strong style={{ color:C.primary }}>#{i+1}</strong></td>
                          <td style={S.td}><strong>{l.titre}</strong></td>
                          <td style={S.td}>{l.auteur}</td><td style={S.td}>{l.categorie}</td>
                          <td style={{...S.td,textAlign:'center'}}>
                            <span style={{...S.badge,background:'#e8eaf6',color:C.primary}}>{l.nb_emprunts}</span>
                          </td>
                          <td style={{...S.td,textAlign:'center'}}>
                            <span style={{...S.badge,
                              background:l.exemplaires_disponibles>0?'#e8f5e9':'#ffebee',
                              color:l.exemplaires_disponibles>0?C.success:C.danger}}>
                              {l.exemplaires_disponibles}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>

            {/* Top users */}
            <div style={S.section}>
              <h3 style={{ color:C.primary, marginBottom:12 }}>Utilisateurs les plus actifs</h3>
              {dashboard.top_utilisateurs.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Nom</th><th style={S.th}>Email</th><th style={S.th}>Type</th>
                      <th style={{...S.th,textAlign:'center'}}>Total</th>
                      <th style={{...S.th,textAlign:'center'}}>En cours</th>
                      <th style={{...S.th,textAlign:'center'}}>En retard</th>
                    </tr></thead>
                    <tbody>
                      {dashboard.top_utilisateurs.map((u,i) => (
                        <tr key={i} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                          <td style={S.td}><strong>{u.prenom} {u.nom}</strong></td>
                          <td style={S.td}>{u.email}</td><td style={S.td}>{u.type_utilisateur}</td>
                          <td style={{...S.td,textAlign:'center'}}>
                            <span style={{...S.badge,background:'#e8eaf6',color:C.primary}}>{u.nb_emprunts}</span>
                          </td>
                          <td style={{...S.td,textAlign:'center'}}>
                            <span style={{...S.badge,background:'#e3f2fd',color:'#1565c0'}}>{u.en_cours}</span>
                          </td>
                          <td style={{...S.td,textAlign:'center'}}>
                            <span style={{...S.badge,
                              background:u.en_retard>0?'#ffebee':'#f5f5f5',
                              color:u.en_retard>0?C.danger:'#999'}}>{u.en_retard}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>

            {/* Activité mensuelle */}
            {dashboard.emprunts_par_mois.length>0 && (
              <div style={S.section}>
                <h3 style={{ color:C.primary, marginBottom:12 }}>Activité par mois</h3>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Mois</th>
                    <th style={{...S.th,textAlign:'center'}}>Total</th>
                    <th style={{...S.th,textAlign:'center'}}>Retournés</th>
                    <th style={{...S.th,textAlign:'center'}}>En cours</th>
                  </tr></thead>
                  <tbody>
                    {dashboard.emprunts_par_mois.map((m,i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                        <td style={S.td}>{m.mois}</td>
                        <td style={{...S.td,textAlign:'center'}}><strong>{m.total}</strong></td>
                        <td style={{...S.td,textAlign:'center',color:C.success}}>{m.retournes}</td>
                        <td style={{...S.td,textAlign:'center',color:'#1565c0'}}>{m.en_cours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>)}
        </div>
      )}

      {/* ══ GESTION LIVRES ═════════════════════════════════════════════════ */}
      {tab==='gestion-livres' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0 }}>Gestion des livres
              <span style={{ fontSize:14, fontWeight:'normal', color:'#777', marginLeft:8 }}>({gLivresTotal})</span>
            </h2>
            <button style={S.btn} onClick={() => {
              setShowLivreForm(true); setEditLivre(null); setLivreMsg('');
              setLivreForm({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
            }}>+ Ajouter un livre</button>
          </div>

          {livreMsg && (
            <div style={{ padding:'10px 14px', borderRadius:6, marginBottom:12, fontSize:13,
              background:livreMsg.startsWith('Erreur')?'#ffebee':'#e8f5e9',
              color:livreMsg.startsWith('Erreur')?C.danger:C.success }}>{livreMsg}</div>
          )}

          {showLivreForm && (
            <div style={{ ...S.card, borderLeft:`4px solid ${C.accent}`, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 14px', color:C.accent }}>
                {editLivre ? `Modifier : ${editLivre.titre}` : 'Nouveau livre'}
              </h3>
              <div style={S.formGrid}>
                {[
                  {key:'titre',             label:'Titre *',              ph:'Titre du livre'},
                  {key:'auteur',            label:'Auteur *',             ph:"Nom de l'auteur"},
                  {key:'isbn',              label:'ISBN *',               ph:'978-...'},
                  {key:'categorie',         label:'Catégorie',            ph:'IA, Data Science...'},
                  {key:'editeur',           label:'Éditeur',              ph:"O'Reilly, Pearson..."},
                  {key:'annee_publication', label:'Année',                ph:'2024', type:'number'},
                  {key:'nombre_exemplaires',label:"Nb d'exemplaires",     ph:'1',    type:'number'},
                ].map(({key,label,ph,type}) => (
                  <div key={key}>
                    <label style={S.label}>{label}</label>
                    <input style={S.input} type={type||'text'} placeholder={ph}
                      value={livreForm[key]}
                      onChange={e => setLivreForm(f=>({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={S.label}>Description</label>
                  <textarea style={{ ...S.input, height:56, resize:'vertical' }}
                    value={livreForm.description}
                    onChange={e => setLivreForm(f=>({...f,description:e.target.value}))} />
                </div>
              </div>
              <div style={{ marginTop:14, display:'flex', gap:8 }}>
                <button style={S.btn} onClick={saveLivre}>
                  {editLivre ? 'Enregistrer les modifications' : 'Ajouter le livre'}
                </button>
                <button style={{ ...S.btn, background:C.gray }}
                  onClick={() => { setShowLivreForm(false); setEditLivre(null); }}>Annuler</button>
              </div>
            </div>
          )}

          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Titre</th><th style={S.th}>Auteur</th><th style={S.th}>Catégorie</th>
              <th style={{...S.th,textAlign:'center'}}>Ex.</th>
              <th style={{...S.th,textAlign:'center'}}>Dispo.</th>
              <th style={{...S.th,textAlign:'center'}}>Actions</th>
            </tr></thead>
            <tbody>
              {gLivres.map((l,i) => (
                <tr key={l.id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                  <td style={S.td}><strong>{l.titre}</strong></td>
                  <td style={S.td}>{l.auteur}</td><td style={S.td}>{l.categorie}</td>
                  <td style={{...S.td,textAlign:'center'}}>{l.nombre_exemplaires}</td>
                  <td style={{...S.td,textAlign:'center'}}>
                    <span style={{...S.badge,
                      background:l.exemplaires_disponibles>0?'#e8f5e9':'#ffebee',
                      color:l.exemplaires_disponibles>0?C.success:C.danger}}>
                      {l.exemplaires_disponibles}
                    </span>
                  </td>
                  <td style={{...S.td,textAlign:'center'}}>
                    <button style={S.btnEdit} onClick={() => startEditLivre(l)}>Modifier</button>
                    {' '}
                    <button style={S.btnDanger} onClick={() => deleteLivre(l.id, l.titre)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {gLivresTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
              <button style={{ ...S.btn, background:gLivresPage===1?'#ccc':C.primary }}
                disabled={gLivresPage===1} onClick={() => setGLivresPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'36px', fontSize:13 }}>Page {gLivresPage} / {gLivresTotalPages}</span>
              <button style={{ ...S.btn, background:gLivresPage===gLivresTotalPages?'#ccc':C.primary }}
                disabled={gLivresPage===gLivresTotalPages} onClick={() => setGLivresPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ══ GESTION UTILISATEURS ═══════════════════════════════════════════ */}
      {tab==='gestion-utilisateurs' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0 }}>Gestion des utilisateurs
              <span style={{ fontSize:14, fontWeight:'normal', color:'#777', marginLeft:8 }}>({gUsersTotal})</span>
            </h2>
            <button style={S.btn} onClick={() => { setShowUserForm(s=>!s); setUserMsg(''); }}>
              {showUserForm ? 'Fermer' : '+ Ajouter un utilisateur'}
            </button>
          </div>

          {userMsg && (
            <div style={{ padding:'10px 14px', borderRadius:6, marginBottom:12, fontSize:13,
              background:userMsg.startsWith('Erreur')?'#ffebee':'#e8f5e9',
              color:userMsg.startsWith('Erreur')?C.danger:C.success }}>{userMsg}</div>
          )}

          {showUserForm && (
            <div style={{ ...S.card, borderLeft:`4px solid ${C.accent}`, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 14px', color:C.accent }}>Nouvel utilisateur</h3>
              <div style={S.formGrid}>
                {[
                  {key:'nom',           label:'Nom *',          ph:'Nom de famille'},
                  {key:'prenom',        label:'Prénom *',        ph:'Prénom'},
                  {key:'email',         label:'Email *',         ph:'email@dit.sn'},
                  {key:'mot_de_passe',  label:'Mot de passe *',  ph:'••••••••', type:'password'},
                ].map(({key,label,ph,type}) => (
                  <div key={key}>
                    <label style={S.label}>{label}</label>
                    <input style={S.input} type={type||'text'} placeholder={ph}
                      value={userForm[key]}
                      onChange={e => setUserForm(f=>({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div>
                  <label style={S.label}>Type *</label>
                  <select style={S.input} value={userForm.type_utilisateur}
                    onChange={e => setUserForm(f=>({...f,type_utilisateur:e.target.value}))}>
                    <option value="etudiant">Étudiant</option>
                    <option value="professeur">Professeur</option>
                    <option value="personnel">Personnel (Gestionnaire)</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop:14, display:'flex', gap:8 }}>
                <button style={S.btn} onClick={saveUser}>Créer le compte</button>
                <button style={{ ...S.btn, background:C.gray }}
                  onClick={() => setShowUserForm(false)}>Annuler</button>
              </div>
            </div>
          )}

          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Nom</th><th style={S.th}>Email</th>
              <th style={S.th}>Type</th>
              <th style={{...S.th,textAlign:'center'}}>ID Modèle</th>
              <th style={{...S.th,textAlign:'center'}}>Statut</th>
              <th style={{...S.th,textAlign:'center'}}>Inscrit le</th>
              <th style={{...S.th,textAlign:'center'}}>Actions</th>
            </tr></thead>
            <tbody>
              {gUsers.map((u,i) => (
                <tr key={u.id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                  <td style={S.td}><strong>{u.prenom} {u.nom}</strong></td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.type_utilisateur}</td>
                  <td style={{...S.td,textAlign:'center'}}>
                    <span style={{...S.badge,background:'#e8eaf6',color:C.primary}}>
                      {u.model_id||'—'}
                    </span>
                  </td>
                  <td style={{...S.td,textAlign:'center'}}>
                    <span style={{...S.badge,
                      background:u.actif?'#e8f5e9':'#ffebee',
                      color:u.actif?C.success:C.danger}}>
                      {u.actif?'Actif':'Inactif'}
                    </span>
                  </td>
                  <td style={{...S.td,textAlign:'center'}}>{fmtDate(u.created_at)}</td>
                  <td style={{...S.td,textAlign:'center'}}>
                    <button style={{...S.btnSm,
                      background:u.actif?'#fff3e0':'#e8f5e9',
                      color:u.actif?C.warn:C.success}}
                      onClick={() => toggleUser(u.id)}>
                      {u.actif?'Désactiver':'Activer'}
                    </button>
                    {' '}
                    <button style={S.btnDanger} onClick={() => deleteUser(u.id, u.nom, u.prenom)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {gUsersTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
              <button style={{ ...S.btn, background:gUsersPage===1?'#ccc':C.primary }}
                disabled={gUsersPage===1} onClick={() => setGUsersPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'36px', fontSize:13 }}>Page {gUsersPage} / {gUsersTotalPages}</span>
              <button style={{ ...S.btn, background:gUsersPage===gUsersTotalPages?'#ccc':C.primary }}
                disabled={gUsersPage===gUsersTotalPages} onClick={() => setGUsersPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ══ EMPRUNTS PAR UTILISATEUR ════════════════════════════════════════ */}
      {tab==='emprunts-user' && (
        <div>
          <h2>Emprunts par utilisateur</h2>
          <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:280 }}>
              <label style={S.label}>Sélectionner un utilisateur</label>
              <select style={S.input} value={empUser}
                onChange={e => { setEmpUser(e.target.value); setEmpHistory(null); }}>
                <option value="">— Choisir un utilisateur —</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email} {u.model_id?`(${u.model_id})`:''}
                  </option>
                ))}
              </select>
            </div>
            <button style={S.btn} onClick={fetchEmpruntsUser} disabled={!empUser}>
              Voir l'historique
            </button>
          </div>

          {empHistory && (
            <>
              <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                {[
                  {val:empHistory.stats.total,     label:'Total',     color:C.primary},
                  {val:empHistory.stats.en_cours,  label:'En cours',  color:'#1565c0'},
                  {val:empHistory.stats.retournes, label:'Retournés', color:C.success},
                  {val:empHistory.stats.en_retard, label:'En retard', color:C.danger},
                ].map(({val,label,color}) => (
                  <div key={label} style={{ ...S.statCard, flex:'none', minWidth:100, padding:'12px 18px' }}>
                    <div style={{ fontSize:22, fontWeight:'bold', color }}>{val}</div>
                    <div style={{ fontSize:12, color:'#666', marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {empHistory.historique.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt pour cet utilisateur.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Livre</th><th style={S.th}>Catégorie</th>
                      <th style={{...S.th,textAlign:'center'}}>Emprunté le</th>
                      <th style={{...S.th,textAlign:'center'}}>Retour prévu</th>
                      <th style={{...S.th,textAlign:'center'}}>Retour effectif</th>
                      <th style={{...S.th,textAlign:'center'}}>Durée</th>
                      <th style={{...S.th,textAlign:'center'}}>Statut</th>
                      <th style={{...S.th,textAlign:'center'}}>Note</th>
                    </tr></thead>
                    <tbody>
                      {empHistory.historique.map((e,i) => (
                        <tr key={e.id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                          <td style={S.td}><strong>{e.titre}</strong></td>
                          <td style={S.td}>{e.categorie}</td>
                          <td style={{...S.td,textAlign:'center'}}>{fmtDate(e.date_emprunt)}</td>
                          <td style={{...S.td,textAlign:'center'}}>{fmtDate(e.date_retour_prevue)}</td>
                          <td style={{...S.td,textAlign:'center'}}>{fmtDate(e.date_retour_effective)}</td>
                          <td style={{...S.td,textAlign:'center'}}>{e.duree_jours}j</td>
                          <td style={{...S.td,textAlign:'center'}}>{statutBadge(e.statut)}</td>
                          <td style={{...S.td,textAlign:'center'}}>
                            {e.note_donnee>0
                              ? <span style={{ color:'#f57c00' }}>{'★'.repeat(Math.round(e.note_donnee))} {e.note_donnee}/5</span>
                              : <span style={{ color:'#bbb' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
