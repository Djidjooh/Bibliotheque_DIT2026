const authMiddleware = require('./auth.middleware');

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.type !== 'personnel') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  });
}

module.exports = adminMiddleware;
