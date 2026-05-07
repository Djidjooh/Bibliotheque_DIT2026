require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/utilisateurs', userRoutes);
app.use('/api/auth',         authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'utilisateurs' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Service Utilisateurs démarré sur le port ${PORT}`);
});
