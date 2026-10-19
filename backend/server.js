const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = 3000;

const db = new Database(path.join(__dirname, 'nutriplan.db'));

db.pragma('foreign_keys = ON');

// Create database tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipe_id TEXT NOT NULL,
        recipe_name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS grocery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        checked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, item_name)
    );
`);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is running!'
    });
});

// Register a user
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: 'Name, email, and password are required.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters.'
        });
    }

    try {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const hashedPassword = bcrypt.hashSync(password, 10);

        const result = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(cleanName, cleanEmail, hashedPassword);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: {
                id: result.lastInsertRowid,
                name: cleanName,
                email: cleanEmail
            }
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                error: 'An account with that email already exists.'
            });
        }

        console.error(error);
        res.status(500).json({
            error: 'Could not create account.'
        });
    }
});

// Log in a user
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required.'
        });
    }

    const user = db.prepare(`
        SELECT * FROM users WHERE email = ?
    `).get(email.trim().toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
            error: 'Invalid email or password.'
        });
    }

    res.json({
        success: true,
        message: 'Login successful!',
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});

// View a user's saved favorites
app.get('/api/favorites/:userId', (req, res) => {
    const favorites = db.prepare(`
        SELECT id, recipe_id, recipe_name
        FROM favorites
        WHERE user_id = ?
        ORDER BY id DESC
    `).all(req.params.userId);

    res.json({ success: true, favorites });
});

// Save a favorite recipe
app.post('/api/favorites', (req, res) => {
    const { userId, recipeId, recipeName } = req.body;

    if (!userId || !recipeId || !recipeName) {
        return res.status(400).json({
            error: 'User ID, recipe ID, and recipe name are required.'
        });
    }

    try {
        const result = db.prepare(`
            INSERT INTO favorites (user_id, recipe_id, recipe_name)
            VALUES (?, ?, ?)
        `).run(userId, String(recipeId), recipeName);

        res.status(201).json({
            success: true,
            message: 'Recipe saved to favorites!',
            id: result.lastInsertRowid
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                error: 'This recipe is already a favorite.'
            });
        }

        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({
                error: 'User does not exist.'
            });
        }

        console.error(error);
        res.status(500).json({
            error: 'Could not save favorite.'
        });
    }
});

// Remove a favorite recipe
app.delete('/api/favorites/:userId/:recipeId', (req, res) => {
    const result = db.prepare(`
        DELETE FROM favorites
        WHERE user_id = ? AND recipe_id = ?
    `).run(req.params.userId, req.params.recipeId);

    if (result.changes === 0) {
        return res.status(404).json({
            error: 'Favorite recipe not found.'
        });
    }

    res.json({
        success: true,
        message: 'Favorite removed.'
    });
});

// Get a user's grocery list
app.get('/api/grocery/:userId', (req, res) => {
    const items = db.prepare(`
        SELECT id, item_name, checked
        FROM grocery_items
        WHERE user_id = ?
        ORDER BY id DESC
    `).all(req.params.userId);

    res.json({ success: true, items });
});

// Add an item to a user's grocery list
app.post('/api/grocery', (req, res) => {
    const { userId, itemName } = req.body;

    if (!userId || typeof itemName !== 'string' || !itemName.trim()) {
        return res.status(400).json({
            error: 'User ID and item name are required.'
        });
    }

    try {
        const cleanItemName = itemName.trim();

        const result = db.prepare(`
            INSERT INTO grocery_items (user_id, item_name)
            VALUES (?, ?)
        `).run(userId, cleanItemName);

        res.status(201).json({
            success: true,
            id: result.lastInsertRowid,
            itemName: cleanItemName
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                error: 'That item is already on your grocery list.'
            });
        }

        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({
                error: 'User does not exist.'
            });
        }

        console.error(error);
        res.status(500).json({
            error: 'Could not add grocery item.'
        });
    }
});

// Check or uncheck a grocery item
app.patch('/api/grocery/:userId/:itemId', (req, res) => {
    const checked = req.body.checked;

    if (typeof checked !== 'boolean') {
        return res.status(400).json({
            error: 'A checked value of true or false is required.'
        });
    }

    const result = db.prepare(`
        UPDATE grocery_items
        SET checked = ?
        WHERE id = ? AND user_id = ?
    `).run(
        checked ? 1 : 0,
        req.params.itemId,
        req.params.userId
    );

    if (result.changes === 0) {
        return res.status(404).json({
            error: 'Grocery item not found.'
        });
    }

    res.json({ success: true });
});

// Remove a grocery item
app.delete('/api/grocery/:userId/:itemId', (req, res) => {
    const result = db.prepare(`
        DELETE FROM grocery_items
        WHERE id = ? AND user_id = ?
    `).run(req.params.itemId, req.params.userId);

    if (result.changes === 0) {
        return res.status(404).json({
            error: 'Grocery item not found.'
        });
    }

    res.json({
        success: true,
        message: 'Grocery item removed.'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`NutriPlan server running at http://localhost:${PORT}`);
});