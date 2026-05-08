const pool = require('../models/db');

const AdminController = {

  // GET /api/admin/livres/stats
  async getStats(req, res) {
    try {
      const [byCategory, stocks, totals] = await Promise.all([
        pool.query(`
          SELECT
            COALESCE(categorie, 'Non classé') AS categorie,
            COUNT(*)                           AS total_titres,
            SUM(nombre_exemplaires)            AS total_exemplaires,
            SUM(exemplaires_disponibles)       AS disponibles
          FROM livres
          GROUP BY categorie
          ORDER BY total_titres DESC
        `),
        pool.query(`
          SELECT id, titre, auteur, categorie,
                 nombre_exemplaires, exemplaires_disponibles
          FROM livres
          WHERE exemplaires_disponibles = 0
          ORDER BY titre
        `),
        pool.query(`
          SELECT
            COUNT(*)                                          AS total_titres,
            SUM(nombre_exemplaires)                          AS total_exemplaires,
            SUM(exemplaires_disponibles)                     AS total_disponibles,
            SUM(nombre_exemplaires - exemplaires_disponibles) AS total_empruntes
          FROM livres
        `),
      ]);

      res.json({
        totaux:            totals.rows[0],
        par_categorie:     byCategory.rows,
        stocks_epuises:    stocks.rows,
        nb_stocks_epuises: stocks.rowCount,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/admin/livres/bulk
  async bulkCreate(req, res) {
    const livres = req.body;
    if (!Array.isArray(livres) || livres.length === 0)
      return res.status(400).json({ error: 'Un tableau de livres est attendu' });
    if (livres.length > 100)
      return res.status(400).json({ error: 'Maximum 100 livres par import' });

    const client = await pool.connect();
    const created = [];
    const errors  = [];

    try {
      await client.query('BEGIN');
      for (const [i, l] of livres.entries()) {
        if (!l.titre || !l.auteur || !l.isbn) {
          errors.push({ index: i, isbn: l.isbn, error: 'titre, auteur et isbn sont obligatoires' });
          continue;
        }
        try {
          const nb = l.nombre_exemplaires || 1;
          const { rows } = await client.query(
            `INSERT INTO livres
               (titre, auteur, isbn, categorie, editeur,
                annee_publication, nombre_exemplaires, exemplaires_disponibles, description)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8)
             RETURNING id, titre, isbn`,
            [l.titre, l.auteur, l.isbn, l.categorie || null,
             l.editeur || null, l.annee_publication || null, nb, l.description || null]
          );
          created.push(rows[0]);
        } catch (e) {
          errors.push({ index: i, isbn: l.isbn, error: e.code === '23505' ? 'ISBN déjà existant' : e.message });
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }

    res.status(207).json({
      importes: created.length,
      erreurs:  errors.length,
      created,
      errors,
    });
  },
};

module.exports = AdminController;
