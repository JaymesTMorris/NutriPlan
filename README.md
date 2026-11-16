# NutriPlan

Vegetarian recipe search with favorites and a grocery list.

## Requirements

- [Node.js](https://nodejs.org/) (LTS)
- [VS Code](https://code.visualstudio.com/) with the **Live Server** extension (Ritwick Dey)

## Setup

```bash
git clone git@github.com:JaymesTMorris/NutriPlan.git
cd NutriPlan
npm install
```

## Run

1. **Start the backend** (from the project root):

   ```bash
   node backend/server.js
   ```

   Runs at `http://localhost:3000`. The SQLite database (`backend/nutriplan.db`) is created automatically.

2. **Start the frontend:** open the project in VS Code, right-click `index.html`, and choose **Open with Live Server** (or click **Go Live** in the status bar).

Keep the backend running while you use the site. Stop it with `Ctrl+C`.
