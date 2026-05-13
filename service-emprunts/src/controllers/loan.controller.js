const LoanModel = require('../models/loan.model');
const { Parser } = require('json2csv');

const LoanController = {

  // GET /api/emprunts
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, statut, utilisateur_id } = req.query;
      const result = await LoanModel.findAll({
        page: +page, limit: +limit, statut, utilisateur_id
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/emprunts/stats
  async getStats(req, res) {
    try {
      const stats = await LoanModel.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/emprunts/utilisateur/:userId
  async getByUser(req, res) {
    try {
      const emprunts = await LoanModel.findByUser(req.params.userId);
      res.json({ emprunts });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/emprunts/:id
  async getOne(req, res) {
    try {
      const emprunt = await LoanModel.findById(req.params.id);
      if (!emprunt) return res.status(404).json({ error: 'Emprunt non trouvé' });
      res.json(emprunt);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/emprunts
  async create(req, res) {
    try {
      const { utilisateur_id, livre_id } = req.body;
      if (!utilisateur_id || !livre_id)
        return res.status(400).json({ error: 'utilisateur_id et livre_id requis' });

      const emprunt = await LoanModel.create({ utilisateur_id, livre_id });
      res.status(201).json(emprunt);
    } catch (err) {
      if (err.message === 'LIVRE_INDISPONIBLE')
        return res.status(409).json({ error: 'Aucun exemplaire disponible' });
      if (err.message === 'EMPRUNT_DEJA_EN_COURS')
        return res.status(409).json({ error: 'Livre déjà emprunté par cet utilisateur' });
      if (err.message === 'LIMITE_EMPRUNTS_ATTEINTE')
        return res.status(409).json({ error: 'Limite de 3 emprunts simultanés atteinte. Retournez un livre avant d\'en emprunter un nouveau.' });
      res.status(500).json({ error: err.message });
    }
  },

  // PATCH /api/emprunts/:id/retourner
  async retourner(req, res) {
    try {
      const emprunt = await LoanModel.retourner(req.params.id);
      res.json(emprunt);
    } catch (err) {
      if (err.message === 'EMPRUNT_INTROUVABLE_OU_DEJA_RETOURNE')
        return res.status(404).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/emprunts/detecter-retards
  async detecterRetards(req, res) {
    try {
      const retards = await LoanModel.detecterRetards();
      res.json({ message: `${retards.length} emprunt(s) mis en retard`, retards });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/emprunts/penalites
  async getPenalites(req, res) {
    try {
      const retards = await LoanModel.getPenalites();
      const total_penalites_fcfa = retards.reduce((s, r) => s + parseInt(r.penalite_fcfa || 0), 0);
      res.json({ retards, total: retards.length, total_penalites_fcfa });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /api/emprunts/export/csv
  async exportCSV(req, res) {
    try {
      const data = await LoanModel.exportForML();
      const parser = new Parser({
        fields: ['user_id', 'book_id', 'categorie', 'statut',
                 'date_emprunt', 'date_retour_effective', 'rating']
      });
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('loans.csv');
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = LoanController;
