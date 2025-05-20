import { setupMinimap, createMinimapRectangle, updateMinimapRectangles } from './minimap.js';

/**
 * Manages the infinite canvas functionality including pan, zoom, and rectangle creation.
 * Handles all canvas-related operations and state management.
 */
class CanvasManager {
    /**
     * Initializes the canvas manager with all necessary elements and state.
     * Sets up the canvas, minimap, and initializes all event listeners.
     */
    constructor() {
        // Elements
        this.canvasContainer = document.getElementById('canvas-container');
        this.infiniteCanvas = document.getElementById('infinite-canvas');
        this.minimapContainer = document.getElementById('minimap-container');
        this.minimap = document.getElementById('minimap');
        this.viewportIndicator = document.getElementById('viewport-indicator');
        this.createBtn = document.getElementById('create-btn');
        
        // State variables
        this.mode = 'pan'; // 'pan' or 'create'
        this.isDrawing = false;
        this.currentRectangle = null;
        this.rectangleStartX = 0;
        this.rectangleStartY = 0;
        this.canvasWidth = 10000;
        this.canvasHeight = 10000;
        
        // Initialize
        this.panzoom = this.createPanzoom();
        this.setupMinimap();
        this.initializeEventListeners();
        this.centerCanvas();
    }
    
    /**
     * Creates and initializes the panzoom functionality for the canvas.
     * Handles panning, zooming, and transform management.
     * @returns {Object} Panzoom API with methods for controlling the canvas transform
     */
    createPanzoom() {
        let scale = 1;
        let translateX = (window.innerWidth - this.canvasWidth) / 2;
        let translateY = (window.innerHeight - this.canvasHeight) / 2;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let disablePan = false;
        
        const applyTransform = () => {
            this.infiniteCanvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            const event = new CustomEvent('panzoomchange', {
                detail: { x: translateX, y: translateY, scale: scale }
            });
            this.infiniteCanvas.dispatchEvent(event);
        };
        
        // Initial transform
        applyTransform();
        
        // Pan logic
        this.infiniteCanvas.addEventListener('mousedown', (e) => {
            if (this.mode === 'pan' && !disablePan) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                this.infiniteCanvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                applyTransform();
                e.preventDefault();
            }
        });
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.infiniteCanvas.style.cursor = 'grab';
            }
        });
        
        // Zoom logic
        this.canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvasContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const pointX = (mouseX - translateX) / scale;
            const pointY = (mouseY - translateY) / scale;
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));
            if (newScale !== scale) {
                translateX = mouseX - pointX * newScale;
                translateY = mouseY - pointY * newScale;
                scale = newScale;
                applyTransform();
            }
        });
        this.canvasContainer.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const rect = this.canvasContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const transform = this.panzoom.getTransform();
            const pointX = (mouseX - transform.x) / transform.scale;
            const pointY = (mouseY - transform.y) / transform.scale;
            const newScale = Math.min(5, transform.scale * 2);
            const newX = mouseX - pointX * newScale;
            const newY = mouseY - pointY * newScale;
            this.panzoom.setPanAndScale(newX, newY, newScale);
        });
        
        return {
            pan: (x, y) => {
                translateX = x;
                translateY = y;
                applyTransform();
            },
            getTransform: () => ({ x: translateX, y: translateY, scale: scale }),
            setOptions: (options) => {
                if (options.hasOwnProperty('disablePan')) {
                    disablePan = options.disablePan;
                }
            },
            zoomWithWheel: () => {},
            setPanAndScale: (newX, newY, newScale) => {
                scale = newScale;
                translateX = newX;
                translateY = newY;
                applyTransform();
            }
        };
    }
    
    /**
     * Sets up the minimap functionality with the current canvas state.
     */
    setupMinimap() {
        setupMinimap({
            minimap: this.minimap,
            minimapContainer: this.minimapContainer,
            viewportIndicator: this.viewportIndicator,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            customPanzoom: this.panzoom,
            infiniteCanvas: this.infiniteCanvas
        });
    }
    
    /**
     * Initializes all event listeners for the canvas.
     * Sets up mouse events for rectangle creation and mode switching.
     */
    initializeEventListeners() {
        this.createBtn.addEventListener('click', () => this.switchMode());
        this.canvasContainer.style.cursor = 'grab';
        this.infiniteCanvas.style.cursor = 'grab';
        this.infiniteCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    /**
     * Centers the canvas in the viewport.
     */
    centerCanvas() {
        this.panzoom.pan(
            (window.innerWidth - this.canvasWidth) / 2,
            (window.innerHeight - this.canvasHeight) / 2
        );
    }
    
    /**
     * Switches between pan and create modes.
     * Updates cursor styles and enables/disables rectangle dragging.
     */
    switchMode() {
        if (this.mode === 'pan') {
            this.mode = 'create';
            this.createBtn.classList.add('active');
            this.canvasContainer.style.cursor = 'crosshair';
            this.infiniteCanvas.style.cursor = 'crosshair';
            // Force reflow and cursor update
            void this.canvasContainer.offsetWidth;
            void this.infiniteCanvas.offsetWidth;
            const evt = new MouseEvent('mousemove', { bubbles: true });
            this.canvasContainer.dispatchEvent(evt);
            this.infiniteCanvas.dispatchEvent(evt);
            this.panzoom.setOptions({ disablePan: true });
            this.setRectanglesDraggable(true);
        } else {
            this.mode = 'pan';
            this.createBtn.classList.remove('active');
            this.canvasContainer.style.cursor = 'grab';
            this.infiniteCanvas.style.cursor = 'grab';
            this.panzoom.setOptions({ disablePan: false });
            this.setRectanglesDraggable(false);
        }
    }
    
    /**
     * Enables or disables dragging for all rectangles on the canvas.
     * @param {boolean} enabled - Whether to enable or disable dragging
     */
    setRectanglesDraggable(enabled) {
        document.querySelectorAll('.rectangle').forEach(rect => {
            interact(rect).draggable({ enabled });
        });
    }
    
    /**
     * Handles the mousedown event for rectangle creation.
     * Initializes a new rectangle at the mouse position.
     * @param {MouseEvent} e - The mousedown event
     */
    handleMouseDown(e) {
        if (this.mode !== 'create') return;
        if (e.target.classList && e.target.classList.contains('rectangle')) return;
        
        this.isDrawing = true;
        const transform = this.panzoom.getTransform();
        const x = (e.clientX - transform.x) / transform.scale;
        const y = (e.clientY - transform.y) / transform.scale;
        
        this.rectangleStartX = x;
        this.rectangleStartY = y;
        
        this.currentRectangle = document.createElement('div');
        this.currentRectangle.className = 'creating-rectangle';
        this.currentRectangle.style.left = `${x}px`;
        this.currentRectangle.style.top = `${y}px`;
        this.currentRectangle.style.width = '0px';
        this.currentRectangle.style.height = '0px';
        this.infiniteCanvas.appendChild(this.currentRectangle);
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Handles the mousemove event for rectangle creation.
     * Updates the size and position of the rectangle being drawn.
     * @param {MouseEvent} e - The mousemove event
     */
    handleMouseMove(e) {
        if (!this.isDrawing || !this.currentRectangle) return;
        
        const transform = this.panzoom.getTransform();
        const x = (e.clientX - transform.x) / transform.scale;
        const y = (e.clientY - transform.y) / transform.scale;
        
        const width = x - this.rectangleStartX;
        const height = y - this.rectangleStartY;
        
        if (width < 0) {
            this.currentRectangle.style.left = `${x}px`;
            this.currentRectangle.style.width = `${Math.abs(width)}px`;
        } else {
            this.currentRectangle.style.left = `${this.rectangleStartX}px`;
            this.currentRectangle.style.width = `${width}px`;
        }
        
        if (height < 0) {
            this.currentRectangle.style.top = `${y}px`;
            this.currentRectangle.style.height = `${Math.abs(height)}px`;
        } else {
            this.currentRectangle.style.top = `${this.rectangleStartY}px`;
            this.currentRectangle.style.height = `${height}px`;
        }
        
        e.preventDefault();
    }
    
    /**
     * Handles the mouseup event for rectangle creation.
     * Finalizes the rectangle or removes it if too small.
     * @param {MouseEvent} e - The mouseup event
     */
    handleMouseUp(e) {
        if (!this.isDrawing || !this.currentRectangle) return;
        this.isDrawing = false;
        
        const width = parseFloat(this.currentRectangle.style.width);
        const height = parseFloat(this.currentRectangle.style.height);
        
        if (width > 0 && height > 0) {
            this.currentRectangle.className = 'rectangle';
            if (this.mode === 'create') {
                this.makeRectangleDraggable(this.currentRectangle);
            } else {
                interact(this.currentRectangle).draggable({ enabled: false });
            }
            createMinimapRectangle(this.currentRectangle);
        } else {
            this.currentRectangle.remove();
        }
        this.currentRectangle = null;
    }
    
    /**
     * Makes a rectangle draggable using Interact.js.
     * Sets up drag constraints and updates the minimap on drag.
     * @param {HTMLElement} rectangle - The rectangle element to make draggable
     */
    makeRectangleDraggable(rectangle) {
        interact(rectangle).draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: this.infiniteCanvas
                })
            ],
            listeners: {
                move: (event) => {
                    const target = event.target;
                    const x = (parseFloat(target.style.left) || 0) + event.dx / this.panzoom.getTransform().scale;
                    const y = (parseFloat(target.style.top) || 0) + event.dy / this.panzoom.getTransform().scale;
                    target.style.left = `${x}px`;
                    target.style.top = `${y}px`;
                    updateMinimapRectangles();
                }
            }
        });
    }
}

// Initialize the canvas manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CanvasManager();
});