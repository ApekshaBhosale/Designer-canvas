# Infinite Canvas App

This project is an HTML-based infinite canvas application with pan, zoom, rectangle creation, and a minimap. It is modularized into separate HTML, CSS, and JavaScript files for maintainability and performance.

## Features
- **Infinite Canvas:** Pan and zoom across a very large drawing area (10,000 x 10,000 px).
- **Rectangle Creation:** Click "Create Rectangle" and drag to draw rectangles anywhere on the canvas.
- **Drag Rectangles:** Move rectangles around the canvas (Interact.js powered).
- **Minimap:** See an overview of the entire canvas, including rectangles and the current viewport.
- **Double-Click Zoom:** Double-click anywhere to zoom in, centered on the clicked point.
- **Smooth Pan/Zoom:** All rectangles and the minimap stay in sync with pan and zoom.

## File Structure
```
project-root/
├── canvas/
│   └── index.html              # Main HTML entry point (access via /canvas)
├── src/
│   ├── css/
│   │   └── style.css           # All styles for the app
│   └── js/
│       ├── canvas.js            # Main JavaScript logic for pan, zoom, rectangles
│       └── minimap.js          # Minimap-related logic (modularized)
```

## How It Works
- **Pan/Zoom:**
  - The entire `#infinite-canvas` is transformed using CSS `translate` and `scale`.
  - Panning is done by dragging the canvas (in pan mode).
  - Zooming is done with the mouse wheel or double-click (zooms in at the cursor).
- **Rectangle Creation:**
  - Click "Create Rectangle" to enter create mode (cursor changes to crosshair).
  - Click and drag on the canvas to draw a rectangle. Release to finalize.
  - Rectangles are absolutely positioned children of `#infinite-canvas` and inherit all pan/zoom transforms.
- **Dragging Rectangles:**
  - Uses Interact.js for smooth, robust drag interactions.
  - Dragging updates both the rectangle and its minimap representation.
- **Minimap:**
  - Shows all rectangles and the current viewport as a red rectangle.
  - Clicking the minimap pans the main canvas to the clicked location.
  - The minimap is draggable.

## Performance Notes
- **Efficient Rendering:**
  - All rectangles are DOM elements, but pan/zoom is handled by a single CSS transform on the parent, so moving/zooming is very fast, even with hundreds of rectangles.
- **Drag/Resize:**
  - Interact.js is highly optimized for many draggable elements, so dragging remains smooth even with many rectangles.
- **Minimap:**
  - Only updates when rectangles move or the viewport changes, minimizing unnecessary DOM updates.
- **Scalability:**
  - The app performs well with hundreds to a few thousand rectangles. For tens of thousands, consider a `<canvas>`-based approach.

## How to Run This Project

1. **Clone or download this repository.**
2. **Navigate to the project directory in your terminal.**
3. **Start a static file server** (required for loading local JS/CSS files):
   - If you have Python 3 installed:
     ```sh
     python3 -m http.server 8000
     ```
   - Or use [serve](https://www.npmjs.com/package/serve) (Node.js):
     ```sh
     npx serve .
     ```
4. **Open your browser and go to:**
   - [http://localhost:8000/canvas](http://localhost:8000/canvas)
5. **Use the app:**
   - Click the "Create Rectangle" button (top right) to draw rectangles.
   - Pan by dragging the canvas (when not in create mode).
   - Zoom with the mouse wheel or double-click.
   - Use the minimap to navigate and see an overview.

## Dependencies
- [Interact.js](https://interactjs.io/) (loaded via CDN for drag functionality)

---
