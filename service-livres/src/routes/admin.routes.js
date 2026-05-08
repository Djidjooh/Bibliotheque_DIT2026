const express          = require('express');
const router           = express.Router();
const AdminController  = require('../controllers/admin.controller');
const adminMiddleware  = require('../middleware/admin.middleware');

router.use(adminMiddleware);

router.get('/livres/stats',  AdminController.getStats);
router.post('/livres/bulk',  AdminController.bulkCreate);

module.exports = router;
