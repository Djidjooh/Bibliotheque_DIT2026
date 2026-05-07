const BookModel = require('../models/book.model');
const Joi = require('joi');

const bookSchema = Joi.object({
  titre:               Joi.string().max(255).required(),
  auteur:              Joi.string().max(255).required(),
  isbn:                Joi.string().max(20).required(),
  categorie:           Joi.string().max(100).optional(),
  editeur:             Joi.string().max(150).optional(),
  annee_publication:   Joi.number().integer().min(1000).max(2100).optional(),
  nombre_exemplaires:  Joi.number().integer().min(1).optional(),
  description:         Joi.string().optional(),
});

const BookController = {

  // GET /api/livres
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await BookModel.findAll({ page: +page, limit: +limit });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/livres/search?q=...
  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: 'Paramètre q requis' });
      const livres = await BookModel.search(q);
      res.json({ livres });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/livres/disponibles
  async getDisponibles(req, res) {
    try {
      const livres = await BookModel.findDisponibles();
      res.json({ livres });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/livres/:id
  async getOne(req, res) {
    try {
      const livre = await BookModel.findById(req.params.id);
      if (!livre) return res.status(404).json({ error: 'Livre non trouvé' });
      res.json(livre);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/livres
  async create(req, res) {
    try {
      const { error, value } = bookSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const livre = await BookModel.create(value);
      res.status(201).json(livre);
    } catch (err) {
      if (err.code === '23505') // violation contrainte UNIQUE (isbn)
        return res.status(409).json({ error: 'ISBN déjà existant' });
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/livres/:id
  async update(req, res) {
    try {
      const { error, value } = bookSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const livre = await BookModel.update(req.params.id, value);
      if (!livre) return res.status(404).json({ error: 'Livre non trouvé' });
      res.json(livre);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/livres/:id
  async delete(req, res) {
    try {
      const deleted = await BookModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Livre non trouvé' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = BookController;
