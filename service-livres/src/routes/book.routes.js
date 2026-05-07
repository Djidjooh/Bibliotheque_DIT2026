const express = require('express');
const router  = express.Router();
const BookController = require('../controllers/book.controller');

// Routes spéciales AVANT /:id pour éviter les conflits
router.get('/search',      BookController.search);
router.get('/disponibles', BookController.getDisponibles);

// CRUD standard
router.get('/',    BookController.getAll);
router.get('/:id', BookController.getOne);
router.post('/',   BookController.create);
router.put('/:id', BookController.update);
router.delete('/:id', BookController.delete);

module.exports = router;
