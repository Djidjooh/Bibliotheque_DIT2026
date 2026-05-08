const pool = require('../models/db');

const DUREE = parseInt(process.env.DUREE_EMPRUNT_JOURS) || 14;

const AdminController = {

  // GET /api/admin/dashboard
  async getDashboard(req, res) {
    try {
      const [global, topLivres, topUsers, parMois, retardsImminents] = await Promise.all([

        // Chiffres globaux (livres + users + emprunts dans un seul pass)
        pool.query(`
          SELECT
            (SELECT COUNT(*)                              FROM utilisateurs)          AS total_utilisateurs,
            (SELECT COUNT(*) FILTER (WHERE actif = true) FROM utilisateurs)          AS utilisateurs_actifs,
            (SELECT COUNT(*)                              FROM livres)               AS total_titres,
            (SELECT SUM(nombre_exemplaires)               FROM livres)               AS total_exemplaires,
            (SELECT SUM(exemplaires_disponibles)          FROM livres)               AS exemplaires_disponibles,
            (SELECT COUNT(*) FILTER (WHERE statut = 'en_cours')  FROM emprunts)      AS emprunts_en_cours,
            (SELECT COUNT(*) FILTER (WHERE statut = 'en_retard') FROM emprunts)      AS emprunts_en_retard,
            (SELECT COUNT(*) FILTER (WHERE statut = 'retourne')  FROM emprunts)      AS emprunts_retournes,
            (SELECT COUNT(*)                              FROM emprunts)             AS total_emprunts
        `),

        // Top 5 livres les plus empruntés
        pool.query(`
          SELECT l.titre, l.auteur, l.categorie,
                 COUNT(e.id) AS nb_emprunts,
                 l.exemplaires_disponibles
          FROM emprunts e
          JOIN livres l ON l.id = e.livre_id
          GROUP BY l.id, l.titre, l.auteur, l.categorie, l.exemplaires_disponibles
          ORDER BY nb_emprunts DESC
          LIMIT 5
        `),

        // Top 5 utilisateurs les plus actifs
        pool.query(`
          SELECT u.nom, u.prenom, u.email, u.type_utilisateur,
                 COUNT(e.id) AS nb_emprunts,
                 COUNT(e.id) FILTER (WHERE e.statut = 'en_cours')  AS en_cours,
                 COUNT(e.id) FILTER (WHERE e.statut = 'en_retard') AS en_retard
          FROM emprunts e
          JOIN utilisateurs u ON u.id = e.utilisateur_id
          GROUP BY u.id, u.nom, u.prenom, u.email, u.type_utilisateur
          ORDER BY nb_emprunts DESC
          LIMIT 5
        `),

        // Emprunts par mois sur les 6 derniers mois
        pool.query(`
          SELECT
            TO_CHAR(DATE_TRUNC('month', date_emprunt), 'YYYY-MM') AS mois,
            COUNT(*)                                               AS total,
            COUNT(*) FILTER (WHERE statut = 'retourne')           AS retournes,
            COUNT(*) FILTER (WHERE statut IN ('en_cours','en_retard')) AS en_cours
          FROM emprunts
          WHERE date_emprunt >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
          GROUP BY mois
          ORDER BY mois
        `),

        // Emprunts qui arrivent à échéance dans 3 jours
        pool.query(`
          SELECT e.id, e.date_retour_prevue,
                 u.nom, u.prenom, u.email,
                 l.titre, l.isbn
          FROM emprunts e
          JOIN utilisateurs u ON u.id = e.utilisateur_id
          JOIN livres       l ON l.id = e.livre_id
          WHERE e.statut = 'en_cours'
            AND e.date_retour_prevue BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
          ORDER BY e.date_retour_prevue
        `),
      ]);

      res.json({
        global:              global.rows[0],
        top_livres:          topLivres.rows,
        top_utilisateurs:    topUsers.rows,
        emprunts_par_mois:   parMois.rows,
        echeances_proches:   retardsImminents.rows,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/admin/retards
  async getRetards(req, res) {
    try {
      const { rows } = await pool.query(`
        SELECT
          e.id, e.date_emprunt, e.date_retour_prevue,
          CURRENT_DATE - e.date_retour_prevue AS jours_retard,
          u.id AS utilisateur_id, u.nom, u.prenom, u.email, u.type_utilisateur,
          l.id AS livre_id, l.titre, l.auteur, l.isbn, l.categorie
        FROM emprunts e
        JOIN utilisateurs u ON u.id = e.utilisateur_id
        JOIN livres       l ON l.id = e.livre_id
        WHERE e.statut = 'en_retard'
        ORDER BY jours_retard DESC
      `);
      res.json({ retards: rows, total: rows.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/admin/emprunts/:id/forcer-retour
  async forcerRetour(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE emprunts
         SET statut = 'retourne', date_retour_effective = CURRENT_DATE
         WHERE id = $1 AND statut IN ('en_cours', 'en_retard')
         RETURNING *`,
        [req.params.id]
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Emprunt introuvable ou déjà retourné' });
      }

      await client.query(
        `UPDATE livres SET exemplaires_disponibles = exemplaires_disponibles + 1 WHERE id = $1`,
        [rows[0].livre_id]
      );

      await client.query('COMMIT');
      res.json({
        message: 'Retour forcé par administrateur',
        emprunt: rows[0],
        admin_id: req.user.id,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  },

  // PATCH /api/admin/emprunts/:id/prolonger
  async prolonger(req, res) {
    try {
      const { jours } = req.body;
      const nbJours = parseInt(jours) || DUREE;
      if (nbJours < 1 || nbJours > 60)
        return res.status(400).json({ error: 'Prolongation entre 1 et 60 jours' });

      const { rows } = await pool.query(
        `UPDATE emprunts
         SET date_retour_prevue = date_retour_prevue + $1,
             statut = CASE WHEN statut = 'en_retard' THEN 'en_cours' ELSE statut END
         WHERE id = $2 AND statut IN ('en_cours', 'en_retard')
         RETURNING *`,
        [nbJours, req.params.id]
      );
      if (!rows[0])
        return res.status(404).json({ error: 'Emprunt introuvable ou déjà retourné' });

      res.json({
        message: `Emprunt prolongé de ${nbJours} jour(s)`,
        emprunt: rows[0],
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/admin/emprunts/utilisateur/:userId
  async historiqueComplet(req, res) {
    try {
      const { rows } = await pool.query(`
        SELECT
          e.id, e.date_emprunt, e.date_retour_prevue, e.date_retour_effective,
          e.statut,
          CASE
            WHEN e.statut = 'retourne'
            THEN e.date_retour_effective - e.date_emprunt
            ELSE CURRENT_DATE - e.date_emprunt
          END AS duree_jours,
          l.titre, l.auteur, l.isbn, l.categorie,
          COALESCE(n.note, 0) AS note_donnee
        FROM emprunts e
        JOIN livres l ON l.id = e.livre_id
        LEFT JOIN notes n
          ON n.utilisateur_id = e.utilisateur_id AND n.livre_id = e.livre_id
        WHERE e.utilisateur_id = $1
        ORDER BY e.date_emprunt DESC
      `, [req.params.userId]);

      const stats = {
        total: rows.length,
        retournes: rows.filter(r => r.statut === 'retourne').length,
        en_cours:  rows.filter(r => r.statut === 'en_cours').length,
        en_retard: rows.filter(r => r.statut === 'en_retard').length,
      };

      res.json({ historique: rows, stats });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AdminController;
