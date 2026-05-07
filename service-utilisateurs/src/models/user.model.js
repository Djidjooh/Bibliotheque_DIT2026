const pool    = require('./db');
const bcrypt  = require('bcryptjs');

const UserModel = {

  // Lister tous les utilisateurs
  async findAll({ page = 1, limit = 10, type }) {
    const offset = (page - 1) * limit;
    let query  = `SELECT id, nom, prenom, email, type_utilisateur, actif, created_at
                  FROM utilisateurs`;
    const params = [];

    if (type) {
      params.push(type);
      query += ` WHERE type_utilisateur = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY created_at DESC
               LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);

    const countQuery = type
      ? `SELECT COUNT(*) FROM utilisateurs WHERE type_utilisateur = $1`
      : `SELECT COUNT(*) FROM utilisateurs`;
    const count = await pool.query(countQuery, type ? [type] : []);

    return { utilisateurs: rows, total: parseInt(count.rows[0].count) };
  },

  // Trouver par ID (sans mot de passe)
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, type_utilisateur, actif, created_at
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  // Trouver par email (avec mot de passe — pour l'auth)
  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM utilisateurs WHERE email = $1`, [email]
    );
    return rows[0] || null;
  },

  // Créer un utilisateur
  async create(data) {
    const { nom, prenom, email, mot_de_passe, type_utilisateur } = data;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const { rows } = await pool.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, type_utilisateur)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, prenom, email, type_utilisateur, actif, created_at`,
      [nom, prenom, email, hash, type_utilisateur]
    );
    return rows[0];
  },

  // Modifier un utilisateur
  async update(id, data) {
    const { nom, prenom, email, type_utilisateur } = data;
    const { rows } = await pool.query(
      `UPDATE utilisateurs
       SET nom=$1, prenom=$2, email=$3, type_utilisateur=$4
       WHERE id=$5
       RETURNING id, nom, prenom, email, type_utilisateur, actif, created_at`,
      [nom, prenom, email, type_utilisateur, id]
    );
    return rows[0] || null;
  },

  // Activer / désactiver un utilisateur
  async toggleActif(id) {
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET actif = NOT actif
       WHERE id = $1
       RETURNING id, nom, prenom, email, actif`,
      [id]
    );
    return rows[0] || null;
  },

  // Supprimer un utilisateur
  async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM utilisateurs WHERE id = $1`, [id]
    );
    return rowCount > 0;
  },

  // Statistiques par type
  async statsByType() {
    const { rows } = await pool.query(
      `SELECT type_utilisateur, COUNT(*) as total
       FROM utilisateurs
       GROUP BY type_utilisateur`
    );
    return rows;
  },
};

module.exports = UserModel;
