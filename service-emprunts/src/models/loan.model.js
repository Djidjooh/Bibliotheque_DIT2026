const pool = require('./db');

const DUREE          = parseInt(process.env.DUREE_EMPRUNT_JOURS) || 30;
const PENALITE_JOUR  = 500; // FCFA par jour de retard

function calculerPenalite(dateRetourPrevue, dateRetourEffective, statut) {
  const prevue = new Date(dateRetourPrevue);
  const ref    = statut === 'retourne' && dateRetourEffective
    ? new Date(dateRetourEffective)
    : new Date();
  ref.setHours(0, 0, 0, 0);
  prevue.setHours(0, 0, 0, 0);

  const joursRetard = Math.max(0, Math.floor((ref - prevue) / 86400000));
  const penalite    = joursRetard * PENALITE_JOUR;
  return { jours_retard: joursRetard, penalite_fcfa: penalite };
}

const LoanModel = {

  // Lister tous les emprunts (avec pagination et filtres)
  async findAll({ page = 1, limit = 10, statut, utilisateur_id }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (statut) {
      params.push(statut);
      conditions.push(`e.statut = $${params.length}`);
    }
    if (utilisateur_id) {
      params.push(utilisateur_id);
      conditions.push(`e.utilisateur_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT e.*,
              u.nom, u.prenom, u.email,
              l.titre, l.auteur, l.isbn
       FROM emprunts e
       JOIN utilisateurs u ON u.id = e.utilisateur_id
       JOIN livres      l ON l.id = e.livre_id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const emprunts = rows.map(row => {
      const { jours_retard, penalite_fcfa } = calculerPenalite(
        row.date_retour_prevue, row.date_retour_effective, row.statut
      );
      return { ...row, jours_retard, penalite_fcfa };
    });

    const countParams = conditions.length
      ? params.slice(0, params.length - 2)
      : [];
    const count = await pool.query(
      `SELECT COUNT(*) FROM emprunts e ${where}`, countParams
    );

    return { emprunts, total: parseInt(count.rows[0].count) };
  },

  // Trouver un emprunt par ID
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT e.*,
              u.nom, u.prenom, u.email,
              l.titre, l.auteur, l.isbn
       FROM emprunts e
       JOIN utilisateurs u ON u.id = e.utilisateur_id
       JOIN livres      l ON l.id = e.livre_id
       WHERE e.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    const { jours_retard, penalite_fcfa } = calculerPenalite(
      row.date_retour_prevue, row.date_retour_effective, row.statut
    );
    return { ...row, jours_retard, penalite_fcfa };
  },

  // Historique d'un utilisateur
  async findByUser(utilisateur_id) {
    const { rows } = await pool.query(
      `SELECT e.*, l.titre, l.auteur, l.isbn, l.categorie
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       WHERE e.utilisateur_id = $1
       ORDER BY e.date_emprunt DESC`,
      [utilisateur_id]
    );
    return rows.map(row => {
      const { jours_retard, penalite_fcfa } = calculerPenalite(
        row.date_retour_prevue, row.date_retour_effective, row.statut
      );
      return { ...row, jours_retard, penalite_fcfa };
    });
  },

  // Créer un emprunt
  async create({ utilisateur_id, livre_id }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Vérifier disponibilité
      const { rows: livres } = await client.query(
        `SELECT exemplaires_disponibles FROM livres WHERE id = $1 FOR UPDATE`,
        [livre_id]
      );
      if (!livres[0] || livres[0].exemplaires_disponibles < 1)
        throw new Error('LIVRE_INDISPONIBLE');

      // Vérifier la limite de 3 emprunts simultanés
      const { rows: countRows } = await client.query(
        `SELECT COUNT(*) FROM emprunts
         WHERE utilisateur_id=$1 AND statut IN ('en_cours', 'en_retard')`,
        [utilisateur_id]
      );
      if (parseInt(countRows[0].count) >= 3)
        throw new Error('LIMITE_EMPRUNTS_ATTEINTE');

      // Vérifier que l'utilisateur n'a pas déjà ce livre
      const { rows: existing } = await client.query(
        `SELECT id FROM emprunts
         WHERE utilisateur_id=$1 AND livre_id=$2 AND statut='en_cours'`,
        [utilisateur_id, livre_id]
      );
      if (existing.length > 0)
        throw new Error('EMPRUNT_DEJA_EN_COURS');

      // Calculer la date de retour prévue (30 jours)
      const dateRetour = new Date();
      dateRetour.setDate(dateRetour.getDate() + DUREE);

      // Créer l'emprunt
      const { rows } = await client.query(
        `INSERT INTO emprunts (utilisateur_id, livre_id, date_retour_prevue)
         VALUES ($1, $2, $3) RETURNING *`,
        [utilisateur_id, livre_id, dateRetour.toISOString().split('T')[0]]
      );

      // Décrémenter exemplaires disponibles
      await client.query(
        `UPDATE livres SET exemplaires_disponibles = exemplaires_disponibles - 1
         WHERE id = $1`,
        [livre_id]
      );

      await client.query('COMMIT');
      return { ...rows[0], jours_retard: 0, penalite_fcfa: 0 };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Retourner un livre
  async retourner(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE emprunts
         SET statut = 'retourne',
             date_retour_effective = CURRENT_DATE
         WHERE id = $1 AND statut IN ('en_cours', 'en_retard')
         RETURNING *`,
        [id]
      );
      if (!rows[0]) throw new Error('EMPRUNT_INTROUVABLE_OU_DEJA_RETOURNE');

      // Réincrémenter exemplaires disponibles
      await client.query(
        `UPDATE livres SET exemplaires_disponibles = exemplaires_disponibles + 1
         WHERE id = $1`,
        [rows[0].livre_id]
      );

      await client.query('COMMIT');
      const row = rows[0];
      const { jours_retard, penalite_fcfa } = calculerPenalite(
        row.date_retour_prevue, row.date_retour_effective, row.statut
      );
      return { ...row, jours_retard, penalite_fcfa };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Détecter les retards et mettre à jour les statuts
  async detecterRetards() {
    const { rows } = await pool.query(
      `UPDATE emprunts
       SET statut = 'en_retard'
       WHERE statut = 'en_cours'
         AND date_retour_prevue < CURRENT_DATE
       RETURNING *`
    );
    return rows.map(row => {
      const { jours_retard, penalite_fcfa } = calculerPenalite(
        row.date_retour_prevue, row.date_retour_effective, row.statut
      );
      return { ...row, jours_retard, penalite_fcfa };
    });
  },

  // Liste des emprunts en retard avec pénalités
  async getPenalites() {
    const { rows } = await pool.query(
      `SELECT e.*,
              u.nom, u.prenom, u.email,
              l.titre, l.auteur, l.isbn, l.categorie,
              (CURRENT_DATE - e.date_retour_prevue) AS jours_retard,
              (CURRENT_DATE - e.date_retour_prevue) * ${PENALITE_JOUR} AS penalite_fcfa
       FROM emprunts e
       JOIN utilisateurs u ON u.id = e.utilisateur_id
       JOIN livres       l ON l.id = e.livre_id
       WHERE e.statut = 'en_retard'
       ORDER BY jours_retard DESC`
    );
    return rows;
  },

  // Statistiques globales
  async getStats() {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE statut = 'en_cours')  AS en_cours,
         COUNT(*) FILTER (WHERE statut = 'retourne')  AS retournes,
         COUNT(*) FILTER (WHERE statut = 'en_retard') AS en_retard,
         COUNT(*)                                      AS total,
         COALESCE(SUM(
           CASE WHEN statut = 'en_retard'
           THEN (CURRENT_DATE - date_retour_prevue) * ${PENALITE_JOUR}
           ELSE 0 END
         ), 0) AS total_penalites_fcfa
       FROM emprunts`
    );
    return rows[0];
  },

  // Export pour DVC (toutes les données d'historique)
  async exportForML() {
    const { rows } = await pool.query(
      `SELECT
         e.utilisateur_id AS user_id,
         e.livre_id       AS book_id,
         l.categorie,
         e.statut,
         e.date_emprunt,
         e.date_retour_effective,
         COALESCE(n.note, 0) AS rating
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       LEFT JOIN notes n
         ON n.utilisateur_id = e.utilisateur_id
        AND n.livre_id = e.livre_id
       ORDER BY e.date_emprunt`
    );
    return rows;
  },
};

module.exports = LoanModel;
