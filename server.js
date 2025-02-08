// server.js
const express = require('express');
const app = express();

// Built-in middleware to parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: false }));

// --- Global Board State ---
// Default board title is "Babysquares"
let boardTitle = "Babysquares";
// Default axis labels (the numbers in the table)
let xLabels = Array.from({ length: 10 }, (_, i) => i.toString());
let yLabels = Array.from({ length: 10 }, (_, i) => i.toString());
// A 10×10 board: each cell holds the buyer's name (or an empty string)
let board = Array.from({ length: 10 }, () => Array(10).fill(""));

// --- Render the Table (with numeric labels) ---
function renderBoard() {
  let html = `<table>`;
  // Top row: an empty top-left cell then the x-axis labels
  html += `<tr><th></th>`;
  xLabels.forEach(label => {
    html += `<th>${label}</th>`;
  });
  html += `</tr>`;
  
  // Rows: y-axis label then the board cells
  for (let i = 0; i < board.length; i++) {
    html += `<tr>`;
    html += `<th>${yLabels[i]}</th>`;
    for (let j = 0; j < board[i].length; j++) {
      const cellValue = board[i][j] || "";
      html += `<td id="cell-${i}-${j}" 
                hx-get="/edit-square?row=${i}&col=${j}" 
                hx-trigger="click" 
                hx-swap="outerHTML">
                ${cellValue}
               </td>`;
    }
    html += `</tr>`;
  }
  html += `</table>`;
  return html;
}

// --- Render the Board Wrapper ---
// This function returns a flex container with:
// - A vertical block on the left for the y-axis description (rotated using writing-mode)
// - A right-hand container with the x-axis description (above) and the board (with numbers)
function renderBoardWrapper() {
  return `<div id="board-wrapper">
    <!-- Vertical Y-Axis Description -->
    <div class="y-axis-desc">
      <div>Last digit of birth weight</div>
      <div class="desc-note">(i.e. '7' wins if it's 6lbs, 7oz, 8lbs, 7 oz)</div>
    </div>
    <!-- Right Side: X-Axis Description and the Table -->
    <div class="right-block">
      <div class="x-axis-desc">
        <div>Last digit of day of birth</div>
        <div class="desc-note">(i.e. '2' wins if it's the 2nd, 12th or 22nd)</div>
      </div>
      <div id="board">
         ${renderBoard()}
      </div>
    </div>
  </div>`;
}

// --- Render the Full HTML Page ---
function renderPage() {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>${boardTitle}</title>
    <!-- Include Google Font and htmx from CDN -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/htmx.org@1.9.2"></script>
    <style>
      /* Global Styles */
      body {
        font-family: 'Roboto', sans-serif;
        background: #f5f5f5;
        color: #333;
        margin: 2em;
      }
      h1, h3 {
        text-align: center;
      }
      
      /* Form Styles */
      form {
        margin-bottom: 1.5em;
        text-align: center;
      }
      input[type="text"] {
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1em;
        margin: 0.5em;
      }
      button {
        padding: 6px 12px;
        border: none;
        background-color: #007BFF;
        color: white;
        border-radius: 4px;
        font-size: 1em;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      button:hover {
        background-color: #0056b3;
      }
      
      /* Table Styles */
      table {
        margin: 1em auto;
        border-collapse: collapse;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      th, td {
        padding: 12px 15px;
        border: 1px solid #ddd;
        text-align: center;
      }
      th {
        background-color: #eaeaea;
      }
      td {
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      td:hover {
        background-color: #f0f0f0;
      }
      
      /* Board Wrapper Styles */
      #board-wrapper {
        display: flex;
        align-items: center;  /* Changed from flex-start to center */
        justify-content: center;
        margin-top: 1.5em;
      }
      .y-axis-desc {
        writing-mode: sideways-lr;
        text-align: center;
        padding: 10px;
        margin-right: 15px;
        font-weight: bold;
      }
      .x-axis-desc {
        text-align: center;
        margin-bottom: 10px;
        font-weight: bold;
      }
      .desc-note {
        font-size: 0.85em;
        font-weight: normal;
        color: #666;
      }
      .right-block {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    </style>
  </head>
  <body>
    <h1>${boardTitle}</h1>
    
    <!-- Board Settings Form -->
    <h3>Edit Board Settings</h3>
    <form hx-post="/update-board" hx-target="#board-wrapper" hx-swap="outerHTML">
      <label>
        Title:
        <input type="text" name="boardTitle" value="${boardTitle}" />
      </label>
      <br/>
      <label>
        X-Axis Labels (comma separated):
        <input type="text" name="xLabels" value="${xLabels.join(',')}" />
      </label>
      <br/>
      <label>
        Y-Axis Labels (comma separated):
        <input type="text" name="yLabels" value="${yLabels.join(',')}" />
      </label>
      <br/>
      <button type="submit">Update Board Settings</button>
    </form>
    
    <!-- Board Wrapper -->
    ${renderBoardWrapper()}
  </body>
</html>`;
}

// --- Routes ---
// Main page
app.get('/', (req, res) => {
  res.send(renderPage());
});

// When a user clicks a square, return an inline form to update that square.
app.get('/edit-square', (req, res) => {
  const { row, col } = req.query;
  const currentValue = board[row][col] || "";
  const formHTML = `<td id="cell-${row}-${col}">
    <form hx-post="/update-square" hx-target="#cell-${row}-${col}" hx-swap="outerHTML">
      <input type="hidden" name="row" value="${row}" />
      <input type="hidden" name="col" value="${col}" />
      <input type="text" name="buyer" value="${currentValue}" placeholder="Your Name" />
      <button type="submit">Save</button>
    </form>
  </td>`;
  res.send(formHTML);
});

// Process updates to a square and return the updated cell.
app.post('/update-square', (req, res) => {
  const { row, col, buyer } = req.body;
  board[row][col] = buyer;
  const cellHTML = `<td id="cell-${row}-${col}" 
          hx-get="/edit-square?row=${row}&col=${col}" 
          hx-trigger="click" 
          hx-swap="outerHTML">
          ${buyer}
        </td>`;
  res.send(cellHTML);
});

// Process updates to the board settings (title and axis labels)
app.post('/update-board', (req, res) => {
  const { boardTitle: newTitle, xLabels: newX, yLabels: newY } = req.body;
  boardTitle = newTitle || boardTitle;
  if (newX) {
    xLabels = newX.split(',').map(label => label.trim());
  }
  if (newY) {
    yLabels = newY.split(',').map(label => label.trim());
  }
  res.send(renderBoardWrapper());
});

// --- Start the Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
