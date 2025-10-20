const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
app.use('/api/users', require('./routes/users'));
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});
 */

const PORT = process.env.PORT || 5000;

// // Test route
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'Server is running!', timestamp: new Date() });
// });

// // Add your routes here
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'API is working!' });
// });

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});