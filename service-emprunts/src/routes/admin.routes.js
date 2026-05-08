const express         = require('express');
const router          = express.Router();
const AdminController = require('../controllers/admin.controller');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(adminMiddleware);

// Dashboard global
router.get('/dashboard',                          AdminController.getDashboard);

// Gestion des retards
router.get('/retards',                            AdminController.getRetards);

// Actions sur un emprunt
router.patch('/emprunts/:id/forcer-retour',       AdminController.forcerRetour);
router.patch('/emprunts/:id/prolonger',           AdminController.prolonger);

// Historique complet d'un utilisateur
router.get('/emprunts/utilisateur/:userId',       AdminController.historiqueComplet);

module.exports = router;
