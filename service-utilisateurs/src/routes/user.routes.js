const express        = require('express');
const router         = express.Router();
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route publique
router.get('/stats', UserController.getStats);

// Routes protégées par JWT
router.get('/',                        authMiddleware, UserController.getAll);
router.get('/:id',                     authMiddleware, UserController.getOne);
router.put('/:id',                     authMiddleware, UserController.update);
router.patch('/:id/toggle',            authMiddleware, UserController.toggle);
router.delete('/:id',                  authMiddleware, UserController.delete);

module.exports = router;
