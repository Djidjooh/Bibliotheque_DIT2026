const UserModel = require('../models/user.model');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

const AuthController = {

  // POST /api/auth/register
  async register(req, res) {
    try {
      const { nom, prenom, email, mot_de_passe, type_utilisateur } = req.body;
      if (!nom || !prenom || !email || !mot_de_passe || !type_utilisateur)
        return res.status(400).json({ error: 'Tous les champs sont requis' });

      const existant = await UserModel.findByEmail(email);
      if (existant)
        return res.status(409).json({ error: 'Email déjà utilisé' });

      const user = await UserModel.create({ nom, prenom, email, mot_de_passe, type_utilisateur });
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, mot_de_passe } = req.body;
      if (!email || !mot_de_passe)
        return res.status(400).json({ error: 'Email et mot de passe requis' });

      const user = await UserModel.findByEmail(email);
      if (!user)
        return res.status(401).json({ error: 'Identifiants incorrects' });

      const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
      if (!valid)
        return res.status(401).json({ error: 'Identifiants incorrects' });

      if (!user.actif)
        return res.status(403).json({ error: 'Compte désactivé' });

      const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type_utilisateur },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        token,
        utilisateur: {
          id:               user.id,
          nom:              user.nom,
          prenom:           user.prenom,
          email:            user.email,
          type_utilisateur: user.type_utilisateur,
          model_id:         user.model_id,
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = AuthController;
