require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const loanRoutes  = require('./routes/loan.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/emprunts', loanRoutes);
app.use('/api/admin',   adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'emprunts' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Service Emprunts démarré sur le port ${PORT}`);
});
