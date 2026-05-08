const pool   = require('../models/db');
const bcrypt = require('bcryptjs');

const AdminController = {

  // GET /api/admin/utilisateurs/search?q=...&type=...&actif=...
  async search(req, res) {
    try {
      const { q = '', type, actif, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      const params = [];
      const conditions = [];

      if (q) {
        params.push(`%${q}%`);
        conditions.push(`(nom ILIKE $${params.length} OR prenom ILIKE $${params.length} OR email ILIKE $${params.length})`);
      }
      if (type) {
        params.push(type);
        conditions.push(`type_utilisateur = $${params.length}`);
      }
      if (actif !== undefined) {
        params.push(actif === 'true');
        conditions.push(`actif = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(+limit, +offset);

      const { rows } = await pool.query(
        `SELECT id, nom, prenom, email, type_utilisateur, actif, created_at
         FROM utilisateurs
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      const countParams = params.slice(0, params.length - 2);
      const count = await pool.query(
        `SELECT COUNT(*) FROM utilisateurs ${where}`, countParams
      );

      res.json({ utilisateurs: rows, total: parseInt(count.rows[0].count) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/admin/utilisateurs/inactifs
  async getInactifs(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT id, nom, prenom, email, type_utilisateur, created_at
         FROM utilisateurs
         WHERE actif = false
         ORDER BY nom, prenom`
      );
      res.json({ utilisateurs: rows, total: rows.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/admin/utilisateurs/:id/reset-password
  async resetPassword(req, res) {
    try {
      const { nouveau_mot_de_passe } = req.body;
      if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6)
        return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' });

      const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
      const { rows } = await pool.query(
        `UPDATE utilisateurs SET mot_de_passe = $1
         WHERE id = $2
         RETURNING id, nom, prenom, email`,
        [hash, req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json({ message: 'Mot de passe réinitialisé', utilisateur: rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/admin/utilisateurs/toggle-bulk
  async toggleBulk(req, res) {
    try {
      const { ids, actif } = req.body;
      if (!Array.isArray(ids) || ids.length === 0)
        return res.status(400).json({ error: 'ids (tableau) requis' });
      if (typeof actif !== 'boolean')
        return res.status(400).json({ error: 'actif (boolean) requis' });

      const { rows } = await pool.query(
        `UPDATE utilisateurs SET actif = $1
         WHERE id = ANY($2::uuid[])
         RETURNING id, nom, prenom, email, actif`,
        [actif, ids]
      );
      res.json({
        message: `${rows.length} utilisateur(s) ${actif ? 'activé(s)' : 'désactivé(s)'}`,
        utilisateurs: rows,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/admin/utilisateurs/stats
  async getStats(req, res) {
    try {
      const [byType, activity] = await Promise.all([
        pool.query(`
          SELECT type_utilisateur,
                 COUNT(*)                             AS total,
                 COUNT(*) FILTER (WHERE actif = true) AS actifs
          FROM utilisateurs
          GROUP BY type_utilisateur
          ORDER BY total DESC
        `),
        pool.query(`
          SELECT
            COUNT(*)                              AS total_utilisateurs,
            COUNT(*) FILTER (WHERE actif = true)  AS actifs,
            COUNT(*) FILTER (WHERE actif = false) AS inactifs,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS nouveaux_30j
          FROM utilisateurs
        `),
      ]);

      res.json({
        activite:     activity.rows[0],
        par_type:     byType.rows,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AdminController;
