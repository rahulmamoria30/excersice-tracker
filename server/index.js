const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL
  );
`);


db.run(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    duration INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);




app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST /api/users - Add a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  console.log('Received body:', req.body); // Log incoming body

  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'Invalid or missing username' });
  }

  const sql = `INSERT INTO users (username) VALUES (?)`;
  const params = [username.trim()];

  console.log('SQL Query:', sql, 'Params:', params); // Log SQL query

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error executing SQL:', err);
      return res.status(500).json({ error: 'Could not add user to the database', details: err.message });
    }
    res.json({ id: this.lastID, username: username.trim() });
  });
});


// GET /api/users - Get all users
app.get('/api/users', (req, res) => {
  console.log("hello");

  const sql = `SELECT * FROM users`; // Query to select all users
  const params = []; // No parameters required

  console.log('Executing SQL Query:', sql); // Log SQL query

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error executing SQL:', err);
      return res.status(500).json({ error: 'Could not retrieve users from the database', details: err.message });
    }

    res.json(rows); // Send all users as the response
  });
});



// POST /api/users/:_id/exercises - Add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!description || !duration || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `INSERT INTO exercises (user_id, description, duration, date) VALUES (?, ?, ?, ?)`;
  const params = [userId, description.trim(), duration, date];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error adding exercise' });
    }
    res.json({
      id: this.lastID,
      userId,
      description,
      duration,
      date,
    });
  });
});

// GET /api/users/:_id/logs - Get exercise log of a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;  // Extract user ID from URL
  const { from, to, limit = 10, skip = 0 } = req.query;  // Optional filters and pagination

  // Validate user ID
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Build the base SQL query for fetching exercises
  let sql = `SELECT * FROM exercises WHERE user_id = ?`;
  let params = [userId];

  // Apply date filters if 'from' or 'to' query parameters are provided
  if (from) {
    sql += ` AND date >= ?`;
    params.push(from);
  }
  if (to) {
    sql += ` AND date <= ?`;
    params.push(to);
  }

  // Apply pagination (limit and skip) if specified
  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(skip));

  // Fetch the exercises for the user with the applied filters and pagination
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching exercises' });
    }

    // Count the total number of exercises that match the filters (without pagination)
    let countSql = `SELECT COUNT(*) AS count FROM exercises WHERE user_id = ?`;
    let countParams = [userId];
    if (from) {
      countSql += ` AND date >= ?`;
      countParams.push(from);
    }
    if (to) {
      countSql += ` AND date <= ?`;
      countParams.push(to);
    }

    db.get(countSql, countParams, (countErr, countRow) => {
      if (countErr) {
        return res.status(500).json({ error: 'Error counting exercises' });
      }

      // Format the response with the user ID, log of exercises, and the total count
      res.json({
        userId: userId,
        logs: rows.map(row => ({
          id: row.id,
          description: row.description,
          duration: row.duration,
          date: row.date
        })),
        count: countRow.count
      });
    });
  });
});


console.log("Port number", process.env.PORT);

// Start the server
const listener = app.listen(process.env.PORT || 8000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
