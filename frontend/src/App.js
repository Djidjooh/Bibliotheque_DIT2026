import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const LIVRES_URL   = process.env.REACT_APP_SERVICE_LIVRES       || 'http://localhost:3001';
const USERS_URL    = process.env.REACT_APP_SERVICE_UTILISATEURS  || 'http://localhost:3002';
const EMPRUNTS_URL = process.env.REACT_APP_SERVICE_EMPRUNTS     || 'http://localhost:3003';
const RECO_URL     = process.env.REACT_APP_SERVICE_RECO         || 'http://localhost:3004';
const DIT_LOGO     = '/logo_dit.png';

const LIMIT = 20;

// ─── DIT Palette ─────────────────────────────────────────────────────────────
const C = {
  primary:  '#004455',
  secondary:'#2d3940',
  accent:   '#2ea3f2',
  teal:     '#29c4a9',
  success:  '#00897b',
  danger:   '#e53935',
  warn:     '#f57c00',
  gray:     '#546e7a',
  light:    '#f0f8fa',
  border:   '#c2d8df',
  bgGrad:   'linear-gradient(145deg, #004455 0%, #2d3940 65%, #1a2730 100%)',
};

const S = {
  card:      { border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:10, background:'#fff', boxShadow:'0 1px 6px #00000010' },
  input:     { padding:'9px 12px', borderRadius:6, border:`1px solid ${C.border}`, fontSize:14, width:'100%', boxSizing:'border-box', outline:'none' },
  btn:       { padding:'9px 18px', background:C.primary, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500 },
  btnAccent: { padding:'9px 18px', background:C.accent,  color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500 },
  btnTeal:   { padding:'9px 18px', background:C.teal,    color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:500 },
  btnSm:     { padding:'5px 12px', border:'none', borderRadius:5, cursor:'pointer', fontSize:12 },
  btnIcon:   { padding:'5px 8px',  border:'none', borderRadius:5, cursor:'pointer', fontSize:15, lineHeight:'1', background:'transparent' },
  btnEdit:   { padding:'5px 8px',  background:'#e1f0fb', color:'#1565c0', border:'none', borderRadius:5, cursor:'pointer', fontSize:15, lineHeight:'1' },
  btnDanger: { padding:'5px 8px',  background:'#ffebee', color:C.danger,  border:'none', borderRadius:5, cursor:'pointer', fontSize:15, lineHeight:'1' },
  btnReturn: { padding:'5px 10px', background:'#e0f7f4', color:C.success, border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:500 },
  badge:     { fontSize:11, padding:'3px 9px', borderRadius:12, fontWeight:'bold', display:'inline-block' },
  th:        { background:'#deeef3', padding:'10px 12px', textAlign:'left', fontWeight:600, fontSize:13, borderBottom:`1px solid ${C.border}` },
  td:        { padding:'9px 12px', fontSize:13, borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' },
  table:     { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:10, overflow:'hidden', border:`1px solid ${C.border}` },
  section:   { marginBottom:28 },
  label:     { fontSize:13, fontWeight:600, display:'block', marginBottom:4, color:C.secondary },
  formGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' },
  statCard:  { background:'#fff', border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 20px', textAlign:'center', flex:1, minWidth:110, boxShadow:'0 1px 4px #0001' },
  msgOk:     { padding:'10px 14px', borderRadius:6, marginBottom:12, fontSize:13, background:'#e0f7f4', color:C.success, border:`1px solid #b2dfdb` },
  msgErr:    { padding:'10px 14px', borderRadius:6, marginBottom:12, fontSize:13, background:'#ffebee', color:C.danger,  border:`1px solid #ffcdd2` },
};

const statutBadge = (s) => {
  const cfg = {
    en_cours: { bg:'#e3f2fd', color:'#1565c0', label:'En cours' },
    retourne: { bg:'#e0f7f4', color:'#00695c', label:'Retourné' },
    en_retard:{ bg:'#ffebee', color:C.danger,  label:'En retard' },
  };
  const c = cfg[s] || { bg:'#f0f0f0', color:'#333', label:s };
  return <span style={{ ...S.badge, background:c.bg, color:c.color }}>{c.label}</span>;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── Header commun ────────────────────────────────────────────────────────────
function AppHeader({ user, role, onLogout }) {
  return (
    <div style={{ background:C.bgGrad, color:'#fff', padding:'0 24px', borderRadius:10, marginBottom:22,
      display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 12px #00000030' }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'8px 0' }}>
        <img src={DIT_LOGO} alt="DIT" style={{ height:56, borderRadius:6, display:'block' }} />
        <div style={{ borderLeft:'1px solid #ffffff40', paddingLeft:16 }}>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'.3px' }}>Bibliothèque Numérique</div>
          <div style={{ fontSize:11, opacity:.7, marginTop:2 }}></div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:13, fontWeight:600 }}>{user.prenom} {user.nom}</div>
          <div style={{ fontSize:11, opacity:.7 }}>{role}</div>
        </div>
        {user.model_id && (
          <span style={{ ...S.badge, background:'#ffffff18', color:'#ffffffcc', fontSize:10 }}>
            {user.model_id}
          </span>
        )}
        <button onClick={onLogout}
          style={{ ...S.btnSm, background:'#ffffff18', color:'#fff', border:'1px solid #ffffff30' }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── Page d'authentification ──────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode,  setMode]  = useState('login');
  const [form,  setForm]  = useState({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'register') {
        await axios.post(`${USERS_URL}/api/auth/register`, form);
        setMode('login');
        setErr('success:Compte créé ! Connectez-vous maintenant.');
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

  const isSuccess = err.startsWith('success:');
  const errMsg    = isSuccess ? err.slice(8) : err;

  return (
    <div style={{ minHeight:'100vh', background:C.bgGrad, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {/* Decorative circles */}
      <div style={{ position:'fixed', top:-80, right:-80, width:260, height:260, borderRadius:'50%', background:'#ffffff08', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'#ffffff06', pointerEvents:'none' }} />

      <div style={{ width:440, background:'#fff', borderRadius:18, boxShadow:'0 12px 50px #00000035', overflow:'hidden' }}>
        {/* Logo header */}
        <div style={{ background:C.primary, padding:'24px 32px 20px', textAlign:'center' }}>
          <img src={DIT_LOGO} alt="DIT Logo" style={{ height:90, borderRadius:8, display:'block', margin:'0 auto 16px' }} />
          <div style={{ height:1, background:'#ffffff25', marginBottom:14 }} />
          <h2 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:600, letterSpacing:'.4px' }}>
            Bibliothèque Numérique
          </h2>
          <p style={{ color:'#a8d8e8', margin:'5px 0 0', fontSize:12 }}></p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
          {[['login','Connexion'], ['register','Inscription']].map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); setErr(''); }}
              style={{ flex:1, padding:'13px', border:'none', cursor:'pointer', fontSize:14, fontWeight:600,
                background: mode===key ? '#fff' : C.light,
                color:      mode===key ? C.primary : C.gray,
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
                  <option value="personnel">Personnel (Gestionnaire)</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginTop:12 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={form.email} onChange={set('email')}
              required placeholder="votre@email.sn" autoComplete="email" />
          </div>
          <div style={{ marginTop:12, marginBottom:18 }}>
            <label style={S.label}>Mot de passe</label>
            <input style={S.input} type="password" value={form.mot_de_passe} onChange={set('mot_de_passe')}
              required placeholder="••••••••" autoComplete={mode==='login'?'current-password':'new-password'} />
          </div>

          {err && (
            <div style={{ ...(isSuccess ? S.msgOk : S.msgErr), marginBottom:14 }}>{errMsg}</div>
          )}

          <button type="submit" style={{ ...S.btn, width:'100%', padding:'12px' }} disabled={busy}>
            {busy ? 'Chargement...' : mode==='login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          {mode === 'login' && (
            <p style={{ marginTop:12, fontSize:11, color:'#999', textAlign:'center', lineHeight:1.6 }}>
              copyright@DIT_M2-IA2026<br />
              <strong style={{ color:C.primary }}></strong> / <strong style={{ color:C.primary }}></strong>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Composant racine ─────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(null);

  const handleLogin  = (user) => setAuthUser(user);
  const handleLogout = () => setAuthUser(null);

  if (!authUser) return <AuthPage onLogin={handleLogin} />;

  return authUser.type_utilisateur === 'personnel'
    ? <AdminApp user={authUser} onLogout={handleLogout} />
    : <UserApp  user={authUser} onLogout={handleLogout} />;
}

// ════════════════════════════════════════════════════════════════════════════
// VUE UTILISATEUR (étudiant / professeur)
// ════════════════════════════════════════════════════════════════════════════
function UserApp({ user, onLogout }) {
  const [tab,         setTab]         = useState('catalogue');
  const [livres,      setLivres]      = useState([]);
  const [totalLivres, setTotalLivres] = useState(0);
  const [searchQ,     setSearchQ]     = useState('');
  const [dispOnly,    setDispOnly]    = useState(false);
  const [catPage,     setCatPage]     = useState(1);
  const [recos,       setRecos]       = useState([]);
  const [recoLoad,    setRecoLoad]    = useState(false);
  const [recoErr,     setRecoErr]     = useState('');
  const [emprunts,    setEmprunts]    = useState([]);
  const [empLoad,     setEmpLoad]     = useState(false);
  const [empMsg,      setEmpMsg]      = useState('');
  const [borrowingId, setBorrowingId] = useState(null);

  // ── Catalogue ───────────────────────────────────────────────────────────
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

  const borrowBook = async (livre) => {
    setBorrowingId(livre.id); setEmpMsg('');
    try {
      await axios.post(`${EMPRUNTS_URL}/api/emprunts`, {
        utilisateur_id: user.id,
        livre_id:       livre.id,
      });
      setEmpMsg(`success:« ${livre.titre} » emprunté avec succès ! Rendez-vous dans "Mes emprunts".`);
      fetchCatalogue();
    } catch(e) {
      setEmpMsg(`error:${e.response?.data?.error || 'Erreur lors de l\'emprunt.'}`);
    } finally { setBorrowingId(null); }
  };

  // ── Mes emprunts ────────────────────────────────────────────────────────
  const fetchEmprunts = useCallback(() => {
    setEmpLoad(true);
    axios.get(`${EMPRUNTS_URL}/api/emprunts/utilisateur/${user.id}`)
      .then(r => setEmprunts(r.data.emprunts||[]))
      .catch(()=> setEmprunts([]))
      .finally(()=> setEmpLoad(false));
  }, [user.id]);

  useEffect(() => { if (tab==='mes-emprunts') fetchEmprunts(); }, [tab, fetchEmprunts]);

  const retournerLivre = async (emprunt) => {
    try {
      await axios.patch(`${EMPRUNTS_URL}/api/emprunts/${emprunt.id}/retourner`);
      fetchEmprunts();
    } catch(e) {
      setEmpMsg(`error:${e.response?.data?.error || 'Erreur lors du retour.'}`);
    }
  };

  // ── Recommandations ─────────────────────────────────────────────────────
  const getRecos = useCallback(() => {
    setRecoLoad(true); setRecoErr(''); setRecos([]);
    axios.get(`${RECO_URL}/api/recommendations/${user.id}?top_k=10`)
      .then(r => {
        const items = r.data.recommandations || [];
        setRecos(items);
        if (items.length === 0) setRecoErr('Aucune recommandation disponible pour le moment.');
      })
      .catch(e => {
        const msg = e.response?.data?.detail || 'Service de recommandation indisponible.';
        setRecoErr(msg);
      })
      .finally(()=> setRecoLoad(false));
  }, [user.id]);

  useEffect(() => { if (tab==='recommandations') getRecos(); }, [tab, getRecos]);

  const catTotalPages = Math.ceil(totalLivres / LIMIT);
  const userTabs = [
    ['catalogue',       '📚 Catalogue'],
    ['mes-emprunts',    '📖 Mes emprunts'],
    ['recommandations', '⭐ Recommandations'],
  ];

  const isMsgOk  = empMsg.startsWith('success:');
  const isMsgErr = empMsg.startsWith('error:');
  const msgText  = empMsg.replace(/^(success|error):/, '');

  return (
    <div style={{ fontFamily:'"Segoe UI", Arial, sans-serif', maxWidth:1040, margin:'0 auto', padding:20, background:C.light, minHeight:'100vh' }}>
      <AppHeader user={user} role={user.type_utilisateur} onLogout={onLogout} />

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {userTabs.map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setEmpMsg(''); }}
            style={{ padding:'9px 18px', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:500,
              background: tab===key ? C.primary : '#fff',
              color:      tab===key ? '#fff'    : C.secondary,
              boxShadow:  tab===key ? '0 2px 8px #00445540' : '0 1px 3px #0001' }}>
            {label}
          </button>
        ))}
      </div>

      {empMsg && (
        <div style={{ ...(isMsgOk ? S.msgOk : isMsgErr ? S.msgErr : {}), marginBottom:16 }}>{msgText}</div>
      )}

      {/* ── CATALOGUE ──────────────────────────────────────────────────────── */}
      {tab === 'catalogue' && (
        <div>
          <h2 style={{ color:C.primary, marginBottom:14 }}>
            Catalogue de livres
            <span style={{ fontSize:14, color:'#888', fontWeight:'normal', marginLeft:10 }}>
              {(searchQ||dispOnly) ? `${livres.length} résultat(s)` : `${totalLivres} livres`}
            </span>
          </h2>

          <form onSubmit={e=>{ e.preventDefault(); setCatPage(1); fetchCatalogue(); }}
            style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
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
            <div key={l.id||i} style={{ ...S.card, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <strong style={{ fontSize:15, color:C.secondary }}>{l.titre}</strong>
                <p style={{ margin:'4px 0 2px', color:'#666', fontSize:13 }}>{l.auteur}</p>
                <p style={{ margin:0, color:'#999', fontSize:12 }}>
                  {l.categorie}{l.annee_publication ? ` · ${l.annee_publication}` : ''}
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <span style={{ ...S.badge,
                  background: l.exemplaires_disponibles>0 ? '#e0f7f4' : '#ffebee',
                  color:      l.exemplaires_disponibles>0 ? C.success  : C.danger }}>
                  {l.exemplaires_disponibles>0 ? `${l.exemplaires_disponibles} dispo.` : 'Indisponible'}
                </span>
                {l.exemplaires_disponibles>0 && (
                  <button style={{ ...S.btnTeal, padding:'6px 14px', fontSize:12 }}
                    disabled={borrowingId===l.id}
                    onClick={() => borrowBook(l)}>
                    {borrowingId===l.id ? '...' : '📥 Emprunter'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {!(searchQ||dispOnly) && catTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:18 }}>
              <button style={{ ...S.btn, background:catPage===1?'#b0bec5':C.primary }}
                disabled={catPage===1} onClick={() => setCatPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'38px', fontSize:13 }}>Page {catPage} / {catTotalPages}</span>
              <button style={{ ...S.btn, background:catPage===catTotalPages?'#b0bec5':C.primary }}
                disabled={catPage===catTotalPages} onClick={() => setCatPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ── MES EMPRUNTS ─────────────────────────────────────────────────── */}
      {tab === 'mes-emprunts' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h2 style={{ color:C.primary, margin:0 }}>Mes emprunts</h2>
            <button style={S.btn} onClick={fetchEmprunts} disabled={empLoad}>🔄 Actualiser</button>
          </div>

          {empLoad && <p style={{ color:'#888' }}>Chargement...</p>}

          {!empLoad && emprunts.length === 0 && (
            <div style={{ ...S.card, textAlign:'center', padding:'40px 24px', color:'#888' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
              <p style={{ margin:0, fontSize:14 }}>Vous n'avez aucun emprunt en cours ou passé.</p>
              <p style={{ margin:'8px 0 0', fontSize:13 }}>Parcourez le catalogue pour emprunter un livre.</p>
            </div>
          )}

          {!empLoad && emprunts.length > 0 && (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
                {[
                  { val: emprunts.filter(e=>e.statut==='en_cours').length,  label:'En cours',  color:'#1565c0', bg:'#e3f2fd' },
                  { val: emprunts.filter(e=>e.statut==='retourne').length,  label:'Retournés', color:C.success, bg:'#e0f7f4' },
                  { val: emprunts.filter(e=>e.statut==='en_retard').length, label:'En retard', color:C.danger,  bg:'#ffebee' },
                  { val: emprunts.length,                                   label:'Total',     color:C.primary, bg:C.light },
                ].map(({val,label,color,bg}) => (
                  <div key={label} style={{ ...S.statCard, background:bg, border:'none', flex:'none', minWidth:90, padding:'12px 18px' }}>
                    <div style={{ fontSize:22, fontWeight:'bold', color }}>{val}</div>
                    <div style={{ fontSize:11, color:'#666', marginTop:3 }}>{label}</div>
                  </div>
                ))}
              </div>

              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Livre</th>
                  <th style={S.th}>Catégorie</th>
                  <th style={{ ...S.th, textAlign:'center' }}>Emprunté le</th>
                  <th style={{ ...S.th, textAlign:'center' }}>Retour prévu (30j)</th>
                  <th style={{ ...S.th, textAlign:'center' }}>Statut</th>
                  <th style={{ ...S.th, textAlign:'center' }}>Pénalité</th>
                  <th style={{ ...S.th, textAlign:'center' }}>Action</th>
                </tr></thead>
                <tbody>
                  {emprunts.map((e, i) => (
                    <tr key={e.id} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                      <td style={S.td}><strong>{e.titre || e.livre_id}</strong></td>
                      <td style={S.td}>{e.categorie || '—'}</td>
                      <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(e.date_emprunt)}</td>
                      <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(e.date_retour_prevue)}</td>
                      <td style={{ ...S.td, textAlign:'center' }}>{statutBadge(e.statut)}</td>
                      <td style={{ ...S.td, textAlign:'center' }}>
                        {e.statut === 'en_retard' ? (
                          <span style={{ color:C.danger, fontWeight:'bold', fontSize:12 }}>
                            {e.jours_retard}j · {parseInt(e.penalite_fcfa||0).toLocaleString()} FCFA
                          </span>
                        ) : (
                          <span style={{ color:'#bbb', fontSize:12 }}>—</span>
                        )}
                      </td>
                      <td style={{ ...S.td, textAlign:'center' }}>
                        {e.statut === 'en_cours' || e.statut === 'en_retard' ? (
                          <span title="Le retour est traité par le gestionnaire de la bibliothèque"
                            style={{ display:'inline-block', padding:'5px 10px', background:'#f5f5f5',
                              color:'#aaa', border:'1px solid #ddd', borderRadius:5, fontSize:12,
                              cursor:'not-allowed', userSelect:'none' }}>
                            ↩ Retour (gestionnaire)
                          </span>
                        ) : (
                          <span style={{ color:'#bbb', fontSize:12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── RECOMMANDATIONS ──────────────────────────────────────────────── */}
      {tab === 'recommandations' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ margin:0, color:C.primary }}>Recommandations personnalisées</h2>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>
                Basées sur votre profil — identifiant modèle :
                <strong style={{ color:C.primary, marginLeft:4 }}>{user.model_id || '(non attribué)'}</strong>
              </p>
            </div>
            <button style={S.btnAccent} onClick={getRecos} disabled={recoLoad}>
              {recoLoad ? 'Chargement...' : '🔄 Actualiser'}
            </button>
          </div>

          {recoErr && (
            <div style={{ ...S.msgErr, marginBottom:16 }}>
              ⚠ {recoErr}
            </div>
          )}

          {recoLoad && <p style={{ color:'#888' }}>Calcul des recommandations en cours...</p>}

          {!recoLoad && recos.length > 0 && (
            <>
              <p style={{ fontSize:13, color:'#666', marginBottom:14 }}>
                {recos.length} livre(s) sélectionné(s) rien que pour vous :
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:14 }}>
                {recos.map((r, i) => (
                  <div key={i} style={{ ...S.card, borderTop:`3px solid ${C.accent}`, position:'relative' }}>
                    <div style={{ position:'absolute', top:12, right:12,
                      ...S.badge, background:'#e8f4fd', color:C.accent }}>
                      ★ {r.score}
                    </div>
                    <p style={{ fontSize:11, color:C.gray, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>
                      {r.categorie}
                    </p>
                    <strong style={{ fontSize:14, display:'block', marginBottom:4, paddingRight:52, color:C.secondary }}>
                      {r.titre || r.book_id}
                    </strong>
                    <p style={{ margin:'0 0 10px', color:'#777', fontSize:13 }}>{r.auteur}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ ...S.badge,
                        background: r.exemplaires_disponibles>0 ? '#e0f7f4' : '#ffebee',
                        color:      r.exemplaires_disponibles>0 ? C.success  : C.danger }}>
                        {r.exemplaires_disponibles>0
                          ? `${r.exemplaires_disponibles} dispo.`
                          : 'Indisponible'}
                      </span>
                      {r.annee_publication && (
                        <span style={{ fontSize:11, color:'#aaa' }}>{r.annee_publication}</span>
                      )}
                    </div>
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
// VUE ADMIN / GESTIONNAIRE
// ════════════════════════════════════════════════════════════════════════════
function AdminApp({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const authH = () => ({ Authorization: `Bearer ${user.token}` });

  // Dashboard
  const [dashboard, setDashboard] = useState(null);

  // Gestion livres
  const [gLivres,       setGLivres]       = useState([]);
  const [gLivresTotal,  setGLivresTotal]  = useState(0);
  const [gLivresPage,   setGLivresPage]   = useState(1);
  const [showLivreForm, setShowLivreForm] = useState(false);
  const [editLivre,     setEditLivre]     = useState(null);
  const [livreForm,     setLivreForm]     = useState({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
  const [livreMsg,      setLivreMsg]      = useState('');

  // Gestion utilisateurs
  const [gUsers,       setGUsers]       = useState([]);
  const [gUsersTotal,  setGUsersTotal]  = useState(0);
  const [gUsersPage,   setGUsersPage]   = useState(1);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm,     setUserForm]     = useState({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
  const [userMsg,      setUserMsg]      = useState('');

  // Emprunts / gestionnaire
  const [allUsers,     setAllUsers]     = useState([]);
  const [allLivres,    setAllLivres]    = useState([]);
  const [empUser,      setEmpUser]      = useState('');
  const [empHistory,   setEmpHistory]   = useState(null);
  const [empMsg,       setEmpMsg]       = useState('');
  const [showEmpForm,  setShowEmpForm]  = useState(false);
  const [newEmpForm,   setNewEmpForm]   = useState({ utilisateur_id:'', livre_id:'' });

  // ── Dashboard ────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(() => {
    axios.get(`${EMPRUNTS_URL}/api/admin/dashboard`, { headers: authH() })
      .then(r => setDashboard(r.data)).catch(()=>{});
  }, []); // eslint-disable-line
  useEffect(() => { if (tab==='dashboard') fetchDashboard(); }, [tab, fetchDashboard]);

  // ── Gestion livres ───────────────────────────────────────────────────────
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
        setLivreMsg('success:Livre modifié avec succès.');
      } else {
        await axios.post(`${LIVRES_URL}/api/livres`, livreForm, { headers: authH() });
        setLivreMsg('success:Livre ajouté avec succès.');
      }
      setShowLivreForm(false); setEditLivre(null);
      setLivreForm({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
      fetchGLivres();
    } catch(e) { setLivreMsg(`error:Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const deleteLivre = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try {
      await axios.delete(`${LIVRES_URL}/api/livres/${id}`, { headers: authH() });
      setLivreMsg('success:Livre supprimé.'); fetchGLivres();
    } catch(e) { setLivreMsg(`error:Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const startEditLivre = (l) => {
    setEditLivre(l);
    setLivreForm({ titre:l.titre, auteur:l.auteur, isbn:l.isbn, categorie:l.categorie||'',
      editeur:l.editeur||'', annee_publication:l.annee_publication||'',
      nombre_exemplaires:l.nombre_exemplaires, description:l.description||'' });
    setShowLivreForm(true);
  };

  // ── Gestion utilisateurs ─────────────────────────────────────────────────
  const fetchGUsers = useCallback(() => {
    axios.get(`${USERS_URL}/api/utilisateurs?limit=${LIMIT}&page=${gUsersPage}`, { headers: authH() })
      .then(r => { setGUsers(r.data.utilisateurs||[]); setGUsersTotal(r.data.total||0); }).catch(()=>{});
  }, [gUsersPage]); // eslint-disable-line
  useEffect(() => { if (tab==='gestion-utilisateurs') fetchGUsers(); }, [tab, fetchGUsers]);

  const saveUser = async () => {
    setUserMsg('');
    try {
      await axios.post(`${USERS_URL}/api/auth/register`, userForm);
      setUserMsg('success:Utilisateur ajouté avec succès.');
      setShowUserForm(false);
      setUserForm({ nom:'', prenom:'', email:'', mot_de_passe:'', type_utilisateur:'etudiant' });
      fetchGUsers();
    } catch(e) { setUserMsg(`error:Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const deleteUser = async (id, nom, prenom) => {
    if (!window.confirm(`Supprimer ${prenom} ${nom} ?`)) return;
    try {
      await axios.delete(`${USERS_URL}/api/utilisateurs/${id}`, { headers: authH() });
      setUserMsg('success:Utilisateur supprimé.'); fetchGUsers();
    } catch(e) { setUserMsg(`error:Erreur : ${e.response?.data?.error||e.message}`); }
  };
  const toggleUser = async (id) => {
    try {
      await axios.patch(`${USERS_URL}/api/utilisateurs/${id}/toggle`, {}, { headers: authH() });
      fetchGUsers();
    } catch(e) {}
  };

  // ── Emprunts (admin) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (tab==='emprunts-user') {
      axios.get(`${USERS_URL}/api/utilisateurs?limit=200`, { headers: authH() })
        .then(r => { setAllUsers(r.data.utilisateurs||[]); }).catch(()=>{});
      axios.get(`${LIVRES_URL}/api/livres?page=1&limit=200`)
        .then(r => setAllLivres(r.data.livres||[])).catch(()=>{});
    }
  }, [tab]); // eslint-disable-line

  const fetchEmpruntsUser = async (userId) => {
    const uid = userId !== undefined ? userId : empUser;
    if (!uid) return;
    try {
      const { data } = await axios.get(
        `${EMPRUNTS_URL}/api/admin/emprunts/utilisateur/${uid}`,
        { headers: authH() }
      );
      setEmpHistory(data);
    } catch(e) { setEmpHistory(null); }
  };

  const createEmprunt = async () => {
    setEmpMsg('');
    if (!newEmpForm.utilisateur_id || !newEmpForm.livre_id) {
      setEmpMsg('error:Veuillez sélectionner un utilisateur et un livre.'); return;
    }
    try {
      await axios.post(`${EMPRUNTS_URL}/api/emprunts`, newEmpForm);
      setEmpMsg('success:Emprunt créé avec succès.');
      setShowEmpForm(false);
      setNewEmpForm({ utilisateur_id:'', livre_id:'' });
      if (newEmpForm.utilisateur_id === empUser) fetchEmpruntsUser(empUser);
    } catch(e) {
      setEmpMsg(`error:${e.response?.data?.error || 'Erreur lors de la création.'}`);
    }
  };

  const retournerAdmin = async (emprunt) => {
    try {
      await axios.patch(`${EMPRUNTS_URL}/api/emprunts/${emprunt.id}/retourner`);
      fetchEmpruntsUser(empUser);
    } catch(e) {
      setEmpMsg(`error:${e.response?.data?.error || 'Erreur lors du retour.'}`);
    }
  };

  const gLivresTotalPages = Math.ceil(gLivresTotal / LIMIT);
  const gUsersTotalPages  = Math.ceil(gUsersTotal  / LIMIT);

  const adminTabs = [
    ['dashboard',            '📊 Tableau de bord'],
    ['gestion-livres',       '📚 Gestion Livres'],
    ['gestion-utilisateurs', '👥 Utilisateurs'],
    ['emprunts-user',        '🔖 Gestion Emprunts'],
  ];

  const Msg = ({ msg }) => {
    if (!msg) return null;
    const ok  = msg.startsWith('success:');
    const err = msg.startsWith('error:');
    const txt = msg.replace(/^(success|error):/, '');
    return <div style={{ ...(ok ? S.msgOk : err ? S.msgErr : {}), marginBottom:12 }}>{txt}</div>;
  };

  return (
    <div style={{ fontFamily:'"Segoe UI", Arial, sans-serif', maxWidth:1120, margin:'0 auto', padding:20, background:C.light, minHeight:'100vh' }}>
      <AppHeader user={user} role="Gestionnaire" onLogout={onLogout} />

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:22, flexWrap:'wrap' }}>
        {adminTabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'9px 18px', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:500,
              background: tab===key ? C.primary : '#fff',
              color:      tab===key ? '#fff'    : C.secondary,
              boxShadow:  tab===key ? '0 2px 8px #00445540' : '0 1px 3px #0001' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ DASHBOARD ════════════════════════════════════════════════════════ */}
      {tab==='dashboard' && (
        <div>
          <h2 style={{ color:C.primary, marginBottom:18 }}>Tableau de bord</h2>
          {!dashboard ? <p style={{ color:'#888' }}>Chargement...</p> : (<>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:26 }}>
              {[
                { val:dashboard.global.total_titres,            label:'Titres',           color:C.primary  },
                { val:dashboard.global.total_exemplaires,       label:'Exemplaires',       color:C.accent   },
                { val:dashboard.global.exemplaires_disponibles, label:'Disponibles',       color:C.success  },
                { val:dashboard.global.total_utilisateurs,      label:'Utilisateurs',      color:'#6a1b9a'  },
                { val:dashboard.global.emprunts_en_cours,       label:'Emprunts en cours', color:'#1565c0'  },
                { val:dashboard.global.emprunts_en_retard,      label:'En retard',         color:C.danger   },
                { val:dashboard.global.total_emprunts,          label:'Total emprunts',    color:C.gray     },
                { val:`${parseInt(dashboard.global.total_penalites_fcfa||0).toLocaleString()} F`, label:'Pénalités (FCFA)', color:C.danger },
              ].map(({val, label, color}) => (
                <div key={label} style={S.statCard}>
                  <div style={{ fontSize:28, fontWeight:'bold', color }}>{val||0}</div>
                  <div style={{ fontSize:11, color:'#777', marginTop:5 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={S.section}>
              <h3 style={{ color:C.primary, marginBottom:12 }}>📈 Livres les plus empruntés</h3>
              {dashboard.top_livres.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt enregistré.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>#</th><th style={S.th}>Titre</th><th style={S.th}>Auteur</th>
                      <th style={S.th}>Catégorie</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Emprunts</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Dispo.</th>
                    </tr></thead>
                    <tbody>
                      {dashboard.top_livres.map((l, i) => (
                        <tr key={i} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                          <td style={S.td}><strong style={{ color:C.accent }}>#{i+1}</strong></td>
                          <td style={S.td}><strong>{l.titre}</strong></td>
                          <td style={S.td}>{l.auteur}</td>
                          <td style={S.td}>{l.categorie}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <span style={{ ...S.badge, background:'#e8f4fd', color:C.accent }}>{l.nb_emprunts}</span>
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <span style={{ ...S.badge,
                              background:l.exemplaires_disponibles>0?'#e0f7f4':'#ffebee',
                              color:l.exemplaires_disponibles>0?C.success:C.danger }}>
                              {l.exemplaires_disponibles}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>

            <div style={S.section}>
              <h3 style={{ color:C.primary, marginBottom:12 }}>👥 Utilisateurs les plus actifs</h3>
              {dashboard.top_utilisateurs.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Nom</th><th style={S.th}>Email</th><th style={S.th}>Type</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Total</th>
                      <th style={{ ...S.th, textAlign:'center' }}>En cours</th>
                      <th style={{ ...S.th, textAlign:'center' }}>En retard</th>
                    </tr></thead>
                    <tbody>
                      {dashboard.top_utilisateurs.map((u, i) => (
                        <tr key={i} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                          <td style={S.td}><strong>{u.prenom} {u.nom}</strong></td>
                          <td style={S.td}>{u.email}</td>
                          <td style={S.td}>{u.type_utilisateur}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <span style={{ ...S.badge, background:'#e8f4fd', color:C.accent }}>{u.nb_emprunts}</span>
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <span style={{ ...S.badge, background:'#e3f2fd', color:'#1565c0' }}>{u.en_cours}</span>
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            <span style={{ ...S.badge,
                              background:u.en_retard>0?'#ffebee':'#f5f5f5',
                              color:u.en_retard>0?C.danger:'#bbb' }}>{u.en_retard}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>

            {dashboard.emprunts_par_mois.length>0 && (
              <div style={S.section}>
                <h3 style={{ color:C.primary, marginBottom:12 }}>📅 Activité mensuelle</h3>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Mois</th>
                    <th style={{ ...S.th, textAlign:'center' }}>Total</th>
                    <th style={{ ...S.th, textAlign:'center' }}>Retournés</th>
                    <th style={{ ...S.th, textAlign:'center' }}>En cours</th>
                  </tr></thead>
                  <tbody>
                    {dashboard.emprunts_par_mois.map((m, i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                        <td style={S.td}>{m.mois}</td>
                        <td style={{ ...S.td, textAlign:'center' }}><strong>{m.total}</strong></td>
                        <td style={{ ...S.td, textAlign:'center', color:C.success }}>{m.retournes}</td>
                        <td style={{ ...S.td, textAlign:'center', color:'#1565c0' }}>{m.en_cours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>)}
        </div>
      )}

      {/* ══ GESTION LIVRES ═══════════════════════════════════════════════════ */}
      {tab==='gestion-livres' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, color:C.primary }}>
              Gestion des livres
              <span style={{ fontSize:14, fontWeight:'normal', color:'#888', marginLeft:8 }}>({gLivresTotal})</span>
            </h2>
            <button style={S.btn} onClick={() => {
              setShowLivreForm(true); setEditLivre(null); setLivreMsg('');
              setLivreForm({ titre:'', auteur:'', isbn:'', categorie:'', editeur:'', annee_publication:'', nombre_exemplaires:1, description:'' });
            }}>+ Ajouter un livre</button>
          </div>

          <Msg msg={livreMsg} />

          {showLivreForm && (
            <div style={{ ...S.card, borderLeft:`4px solid ${C.accent}`, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 14px', color:C.accent }}>
                {editLivre ? `Modifier : ${editLivre.titre}` : 'Nouveau livre'}
              </h3>
              <div style={S.formGrid}>
                {[
                  { key:'titre',             label:'Titre *',          ph:'Titre du livre' },
                  { key:'auteur',            label:'Auteur *',         ph:"Nom de l'auteur" },
                  { key:'isbn',              label:'ISBN *',           ph:'978-...' },
                  { key:'categorie',         label:'Catégorie',        ph:'IA, Data Science...' },
                  { key:'editeur',           label:'Éditeur',          ph:"O'Reilly, Pearson..." },
                  { key:'annee_publication', label:'Année',            ph:'2024', type:'number' },
                  { key:'nombre_exemplaires',label:"Nb d'exemplaires", ph:'1',    type:'number' },
                ].map(({ key, label, ph, type }) => (
                  <div key={key}>
                    <label style={S.label}>{label}</label>
                    <input style={S.input} type={type||'text'} placeholder={ph}
                      value={livreForm[key]}
                      onChange={e => setLivreForm(f => ({ ...f, [key]:e.target.value }))} />
                  </div>
                ))}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={S.label}>Description</label>
                  <textarea style={{ ...S.input, height:56, resize:'vertical' }}
                    value={livreForm.description}
                    onChange={e => setLivreForm(f => ({ ...f, description:e.target.value }))} />
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
              <th style={S.th}>Titre</th><th style={S.th}>Auteur</th>
              <th style={S.th}>Catégorie</th>
              <th style={{ ...S.th, textAlign:'center' }}>Ex.</th>
              <th style={{ ...S.th, textAlign:'center' }}>Dispo.</th>
              <th style={{ ...S.th, textAlign:'center' }}>Actions</th>
            </tr></thead>
            <tbody>
              {gLivres.map((l, i) => (
                <tr key={l.id} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                  <td style={S.td}><strong>{l.titre}</strong></td>
                  <td style={S.td}>{l.auteur}</td>
                  <td style={S.td}>{l.categorie}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>{l.nombre_exemplaires}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>
                    <span style={{ ...S.badge,
                      background:l.exemplaires_disponibles>0?'#e0f7f4':'#ffebee',
                      color:l.exemplaires_disponibles>0?C.success:C.danger }}>
                      {l.exemplaires_disponibles}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign:'center' }}>
                    <button style={S.btnEdit}  title="Modifier"   onClick={() => startEditLivre(l)}>✏️</button>
                    {' '}
                    <button style={S.btnDanger} title="Supprimer" onClick={() => deleteLivre(l.id, l.titre)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {gLivresTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
              <button style={{ ...S.btn, background:gLivresPage===1?'#b0bec5':C.primary }}
                disabled={gLivresPage===1} onClick={() => setGLivresPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'38px', fontSize:13 }}>Page {gLivresPage} / {gLivresTotalPages}</span>
              <button style={{ ...S.btn, background:gLivresPage===gLivresTotalPages?'#b0bec5':C.primary }}
                disabled={gLivresPage===gLivresTotalPages} onClick={() => setGLivresPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ══ GESTION UTILISATEURS ═════════════════════════════════════════════ */}
      {tab==='gestion-utilisateurs' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, color:C.primary }}>
              Gestion des utilisateurs
              <span style={{ fontSize:14, fontWeight:'normal', color:'#888', marginLeft:8 }}>({gUsersTotal})</span>
            </h2>
            <button style={S.btn} onClick={() => { setShowUserForm(s=>!s); setUserMsg(''); }}>
              {showUserForm ? 'Fermer' : '+ Ajouter un utilisateur'}
            </button>
          </div>

          <Msg msg={userMsg} />

          {showUserForm && (
            <div style={{ ...S.card, borderLeft:`4px solid ${C.accent}`, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 14px', color:C.accent }}>Nouvel utilisateur</h3>
              <div style={S.formGrid}>
                {[
                  { key:'nom',          label:'Nom *',         ph:'Nom de famille' },
                  { key:'prenom',       label:'Prénom *',       ph:'Prénom' },
                  { key:'email',        label:'Email *',        ph:'email@dit.sn' },
                  { key:'mot_de_passe', label:'Mot de passe *', ph:'••••••••', type:'password' },
                ].map(({ key, label, ph, type }) => (
                  <div key={key}>
                    <label style={S.label}>{label}</label>
                    <input style={S.input} type={type||'text'} placeholder={ph}
                      value={userForm[key]}
                      onChange={e => setUserForm(f => ({ ...f, [key]:e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={S.label}>Type *</label>
                  <select style={S.input} value={userForm.type_utilisateur}
                    onChange={e => setUserForm(f => ({ ...f, type_utilisateur:e.target.value }))}>
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
              <th style={{ ...S.th, textAlign:'center' }}>ID Modèle</th>
              <th style={{ ...S.th, textAlign:'center' }}>Statut</th>
              <th style={{ ...S.th, textAlign:'center' }}>Inscrit le</th>
              <th style={{ ...S.th, textAlign:'center' }}>Actions</th>
            </tr></thead>
            <tbody>
              {gUsers.map((u, i) => (
                <tr key={u.id} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                  <td style={S.td}><strong>{u.prenom} {u.nom}</strong></td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.type_utilisateur}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>
                    <span style={{ ...S.badge, background:'#e8f4fd', color:C.accent }}>
                      {u.model_id||'—'}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign:'center' }}>
                    <span style={{ ...S.badge,
                      background:u.actif?'#e0f7f4':'#ffebee',
                      color:u.actif?C.success:C.danger }}>
                      {u.actif?'Actif':'Inactif'}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(u.created_at)}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>
                    <button style={{ ...S.btnSm,
                      background:u.actif?'#fff8e1':'#e0f7f4',
                      color:u.actif?C.warn:C.success }}
                      onClick={() => toggleUser(u.id)}>
                      {u.actif?'Désactiver':'Activer'}
                    </button>
                    {' '}
                    <button style={S.btnDanger} title="Supprimer" onClick={() => deleteUser(u.id, u.nom, u.prenom)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {gUsersTotalPages>1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
              <button style={{ ...S.btn, background:gUsersPage===1?'#b0bec5':C.primary }}
                disabled={gUsersPage===1} onClick={() => setGUsersPage(p=>p-1)}>← Précédent</button>
              <span style={{ lineHeight:'38px', fontSize:13 }}>Page {gUsersPage} / {gUsersTotalPages}</span>
              <button style={{ ...S.btn, background:gUsersPage===gUsersTotalPages?'#b0bec5':C.primary }}
                disabled={gUsersPage===gUsersTotalPages} onClick={() => setGUsersPage(p=>p+1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* ══ GESTION EMPRUNTS ═════════════════════════════════════════════════ */}
      {tab==='emprunts-user' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h2 style={{ margin:0, color:C.primary }}>Gestion des emprunts</h2>
            <button style={S.btnTeal} onClick={() => { setShowEmpForm(s=>!s); setEmpMsg(''); }}>
              {showEmpForm ? '✕ Fermer' : '+ Créer un emprunt'}
            </button>
          </div>

          <Msg msg={empMsg} />

          {/* Formulaire nouvel emprunt */}
          {showEmpForm && (
            <div style={{ ...S.card, borderLeft:`4px solid ${C.teal}`, marginBottom:20 }}>
              <h3 style={{ margin:'0 0 14px', color:C.teal }}>Nouvel emprunt</h3>
              <div style={S.formGrid}>
                <div>
                  <label style={S.label}>Utilisateur *</label>
                  <select style={S.input} value={newEmpForm.utilisateur_id}
                    onChange={e => setNewEmpForm(f => ({ ...f, utilisateur_id:e.target.value }))}>
                    <option value="">— Choisir un utilisateur —</option>
                    {allUsers.filter(u => u.type_utilisateur !== 'personnel').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Livre *</label>
                  <select style={S.input} value={newEmpForm.livre_id}
                    onChange={e => setNewEmpForm(f => ({ ...f, livre_id:e.target.value }))}>
                    <option value="">— Choisir un livre —</option>
                    {allLivres.filter(l => l.exemplaires_disponibles>0).map(l => (
                      <option key={l.id} value={l.id}>
                        {l.titre} — {l.auteur} ({l.exemplaires_disponibles} dispo.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop:14, display:'flex', gap:8 }}>
                <button style={{ ...S.btn, background:C.teal }} onClick={createEmprunt}>Créer l'emprunt</button>
                <button style={{ ...S.btn, background:C.gray }} onClick={() => setShowEmpForm(false)}>Annuler</button>
              </div>
            </div>
          )}

          {/* Sélection utilisateur */}
          <div style={{ ...S.card, display:'flex', gap:12, alignItems:'flex-end', marginBottom:20 }}>
            <div style={{ flex:1 }}>
              <label style={S.label}>Voir les emprunts d'un utilisateur</label>
              <select style={S.input} value={empUser}
                onChange={e => { setEmpUser(e.target.value); setEmpHistory(null); }}>
                <option value="">— Sélectionner un utilisateur —</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email} {u.model_id?`(${u.model_id})`:''}
                  </option>
                ))}
              </select>
            </div>
            <button style={S.btn} onClick={() => fetchEmpruntsUser(empUser)} disabled={!empUser}>
              Charger l'historique
            </button>
          </div>

          {empHistory && (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
                {[
                  { val:empHistory.stats.total,     label:'Total',     color:C.primary, bg:C.light },
                  { val:empHistory.stats.en_cours,  label:'En cours',  color:'#1565c0', bg:'#e3f2fd' },
                  { val:empHistory.stats.retournes, label:'Retournés', color:C.success, bg:'#e0f7f4' },
                  { val:empHistory.stats.en_retard, label:'En retard', color:C.danger,  bg:'#ffebee' },
                  { val:`${parseInt(empHistory.stats.total_penalites_fcfa||0).toLocaleString()} F`, label:'Pénalités', color:C.danger, bg:'#fff3e0' },
                ].map(({ val, label, color, bg }) => (
                  <div key={label} style={{ ...S.statCard, background:bg, border:'none', flex:'none', minWidth:100, padding:'12px 18px' }}>
                    <div style={{ fontSize:22, fontWeight:'bold', color }}>{val}</div>
                    <div style={{ fontSize:11, color:'#666', marginTop:3 }}>{label}</div>
                  </div>
                ))}
              </div>

              {empHistory.historique.length===0
                ? <p style={{ color:'#888' }}>Aucun emprunt pour cet utilisateur.</p>
                : <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Livre</th>
                      <th style={S.th}>Catégorie</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Emprunté le</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Retour prévu (30j)</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Retour effectif</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Durée</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Statut</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Retard / Pénalité</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Note</th>
                      <th style={{ ...S.th, textAlign:'center' }}>Action</th>
                    </tr></thead>
                    <tbody>
                      {empHistory.historique.map((e, i) => (
                        <tr key={e.id} style={{ background:i%2===0?'#fff':'#f9fbfc' }}>
                          <td style={S.td}><strong>{e.titre}</strong></td>
                          <td style={S.td}>{e.categorie}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(e.date_emprunt)}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(e.date_retour_prevue)}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>{fmtDate(e.date_retour_effective)}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>{e.duree_jours}j</td>
                          <td style={{ ...S.td, textAlign:'center' }}>{statutBadge(e.statut)}</td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            {parseInt(e.jours_retard||0) > 0 ? (
                              <span style={{ color:C.danger, fontWeight:'bold', fontSize:12 }}>
                                {e.jours_retard}j · {parseInt(e.penalite_fcfa||0).toLocaleString()} FCFA
                              </span>
                            ) : (
                              <span style={{ color:'#4caf50', fontSize:12 }}>Aucune</span>
                            )}
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            {e.note_donnee>0
                              ? <span style={{ color:'#f57c00' }}>{'★'.repeat(Math.round(e.note_donnee))} {e.note_donnee}/5</span>
                              : <span style={{ color:'#ccc' }}>—</span>}
                          </td>
                          <td style={{ ...S.td, textAlign:'center' }}>
                            {(e.statut==='en_cours' || e.statut==='en_retard') ? (
                              <button style={S.btnReturn} onClick={() => retournerAdmin(e)}>
                                ↩ Retourner
                              </button>
                            ) : (
                              <span style={{ color:'#ccc', fontSize:12 }}>—</span>
                            )}
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
