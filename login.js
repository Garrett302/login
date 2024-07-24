const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000', // Adjust this to your React app's URL if needed
  credentials: true, // Allow credentials
}));

app.use(bodyParser.json());
app.use(cookieParser());

const db = mysql.createConnection({
  host: 'ec2-44-212-120-131.compute-1.amazonaws.com',
  user: 'user', // Update to 'root' or the actual username if different
  password: 'password',
  database: 'db',
  port: 3306,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);  // Exit with a failure status code
  }
  console.log('MySQL Connected...');
});

// Secret key for JWT
const JWT_SECRET = 'imgay'; // Replace with your actual secret

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password' });
  }

  // Check if the user exists
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    // Compare the password with the hashed password in the database
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid username or password' });
      }

      // Create a token
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

      // Set the token as a cookie
      res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Lax' });

      res.status(200).json({ message: 'Login successful' });
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3002; // Different port for login API
app.listen(PORT, () => {
  console.log(`Login server running on port ${PORT}`);
});
