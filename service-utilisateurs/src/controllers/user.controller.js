const UserModel = require('../models/user.model');
const Joi       = require('joi');

const userSchema = Joi.object({
  nom:              Joi.string().max(100).required(),
  prenom:           Joi.string().max(100).required(),
  email:            Joi.string().email().max(150).required(),
  type_utilisateur: Joi.string().valid('etudiant', 'professeur', 'personnel').required(),
});

const UserController = {

  // GET /api/utilisateurs
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, type } = req.query;
      const result = await UserModel.findAll({ page: +page, limit: +limit, type });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/utilisateurs/stats
  async getStats(req, res) {
    try {
      const stats = await UserModel.statsByType();
      res.json({ stats });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/utilisateurs/:id
  async getOne(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/utilisateurs/:id
  async update(req, res) {
    try {
      const { error, value } = userSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const user = await UserModel.update(req.params.id, value);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/utilisateurs/:id/toggle
  async toggle(req, res) {
    try {
      const user = await UserModel.toggleActif(req.params.id);
      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/utilisateurs/:id
  async delete(req, res) {
    try {
      const deleted = await UserModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = UserController;
