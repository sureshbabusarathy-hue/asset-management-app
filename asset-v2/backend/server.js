const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.json({ message: 'Naandi Asset Management API ✅' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(`MongoDB Connected: ${mongoose.connection.host}`))
  .catch(err => console.error('Database connection error:', err.message));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));