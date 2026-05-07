const pool = require('./db');

const BookModel = {

  // Lister tous les livres
  async findAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT * FROM livres ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query(`SELECT COUNT(*) FROM livres`);
    return { livres: rows, total: parseInt(count.rows[0].count) };
  },

  // Trouver un livre par ID
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM livres WHERE id = $1`, [id]
    );
    return rows[0] || null;
  },

  // Recherche par titre, auteur ou ISBN
  async search(query) {
    const term = `%${query}%`;
    const { rows } = await pool.query(
      `SELECT * FROM livres
       WHERE titre  ILIKE $1
          OR auteur ILIKE $1
          OR isbn   ILIKE $1
       ORDER BY titre`,
      [term]
    );
    return rows;
  },

  // Créer un livre
  async create(data) {
    const { titre, auteur, isbn, categorie, editeur,
            annee_publication, nombre_exemplaires, description } = data;
    const { rows } = await pool.query(
      `INSERT INTO livres
         (titre, auteur, isbn, categorie, editeur,
          annee_publication, nombre_exemplaires, exemplaires_disponibles, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8)
       RETURNING *`,
      [titre, auteur, isbn, categorie, editeur,
       annee_publication, nombre_exemplaires, description]
    );
    return rows[0];
  },

  // Modifier un livre
  async update(id, data) {
    const { titre, auteur, isbn, categorie, editeur,
            annee_publication, nombre_exemplaires, description } = data;
    const { rows } = await pool.query(
      `UPDATE livres SET
         titre=$1, auteur=$2, isbn=$3, categorie=$4,
         editeur=$5, annee_publication=$6,
         nombre_exemplaires=$7, description=$8
       WHERE id=$9 RETURNING *`,
      [titre, auteur, isbn, categorie, editeur,
       annee_publication, nombre_exemplaires, description, id]
    );
    return rows[0] || null;
  },

  // Supprimer un livre
  async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM livres WHERE id = $1`, [id]
    );
    return rowCount > 0;
  },

  // Livres disponibles seulement
  async findDisponibles() {
    const { rows } = await pool.query(
      `SELECT * FROM livres WHERE exemplaires_disponibles > 0 ORDER BY titre`
    );
    return rows;
  },
};

module.exports = BookModel;
