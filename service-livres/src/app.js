require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const bookRoutes  = require('./routes/book.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/livres', bookRoutes);
app.use('/api/admin',  adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'livres' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Service Livres démarré sur le port ${PORT}`);
});
