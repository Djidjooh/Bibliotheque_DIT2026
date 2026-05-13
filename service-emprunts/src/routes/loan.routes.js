const express        = require('express');
const router         = express.Router();
const LoanController = require('../controllers/loan.controller');

// Routes spéciales avant /:id
router.get('/stats',                  LoanController.getStats);
router.get('/penalites',              LoanController.getPenalites);
router.get('/export/csv',             LoanController.exportCSV);
router.get('/utilisateur/:userId',    LoanController.getByUser);
router.post('/detecter-retards',      LoanController.detecterRetards);

// CRUD standard
router.get('/',                       LoanController.getAll);
router.get('/:id',                    LoanController.getOne);
router.post('/',                      LoanController.create);
router.patch('/:id/retourner',        LoanController.retourner);

module.exports = router;
