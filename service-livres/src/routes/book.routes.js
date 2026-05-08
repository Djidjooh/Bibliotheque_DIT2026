const express        = require('express');
const router         = express.Router();
const BookController = require('../controllers/book.controller');
const adminMiddleware = require('../middleware/admin.middleware');

// Routes spéciales AVANT /:id pour éviter les conflits
router.get('/search',      BookController.search);
router.get('/disponibles', BookController.getDisponibles);

// CRUD — lecture publique, écriture réservée aux admins
router.get('/',       BookController.getAll);
router.get('/:id',    BookController.getOne);
router.post('/',      adminMiddleware, BookController.create);
router.put('/:id',    adminMiddleware, BookController.update);
router.delete('/:id', adminMiddleware, BookController.delete);

module.exports = router;
