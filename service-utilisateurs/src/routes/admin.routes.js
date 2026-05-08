const express         = require('express');
const router          = express.Router();
const AdminController = require('../controllers/admin.controller');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(adminMiddleware);

router.get('/utilisateurs/search',          AdminController.search);
router.get('/utilisateurs/inactifs',        AdminController.getInactifs);
router.get('/utilisateurs/stats',           AdminController.getStats);
router.patch('/utilisateurs/:id/reset-password', AdminController.resetPassword);
router.patch('/utilisateurs/toggle-bulk',   AdminController.toggleBulk);

module.exports = router;
