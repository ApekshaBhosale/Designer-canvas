// Minimap module for Infinite Canvas
// Exports functions for minimap rectangle creation, update, viewport, and setup

/**
 * Manages the minimap functionality for the infinite canvas.
 * Handles minimap representation, viewport indicator, and navigation.
 */
class MinimapManager {
    /**
     * Initializes the minimap manager with all necessary elements and state.
     * Sets up the minimap, viewport indicator, and initializes all event listeners.
     * @param {Object} options - Configuration options for the minimap
     * @param {HTMLElement} options.minimap - The minimap container element
     * @param {HTMLElement} options.minimapContainer - The container for the minimap
     * @param {HTMLElement} options.viewportIndicator - The viewport indicator element
     * @param {number} options.canvasWidth - The width of the main canvas
     * @param {number} options.canvasHeight - The height of the main canvas
     * @param {Object} options.customPanzoom - The panzoom instance
     * @param {HTMLElement} options.infiniteCanvas - The main infinite canvas element
     */
    constructor(options) {
        this.minimap = options.minimap;
        this.minimapContainer = options.minimapContainer;
        this.viewportIndicator = options.viewportIndicator;
        this.canvasWidth = options.canvasWidth;
        this.canvasHeight = options.canvasHeight;
        this.customPanzoom = options.customPanzoom;
        this.infiniteCanvas = options.infiniteCanvas;

        this.initialize();
    }

    /**
     * Initializes all minimap functionality and event listeners.
     * Sets up click navigation and dragging capabilities.
     */
    initialize() {
        // Minimap click navigation
        this.minimap.addEventListener('click', (e) => this.handleMinimapClick(e));

        // Make minimap draggable with interact.js
        interact(this.minimapContainer).draggable({
            listeners: {
                move: (event) => {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            }
        });

        // Register to update minimap on panzoom changes
        this.infiniteCanvas.addEventListener('panzoomchange', () => this.updateMinimapViewport());

        // Initial update of the minimap viewport
        setTimeout(() => this.updateMinimapViewport(), 100);
    }

    /**
     * Creates a minimap representation for a rectangle.
     * Links the minimap rectangle to the main rectangle with a unique identifier.
     * @param {HTMLElement} rectangle - The main rectangle element
     */
    createMinimapRectangle(rectangle) {
        const miniRect = document.createElement('div');
        miniRect.className = 'mini-rectangle';
        miniRect.dataset.forRectangle = Date.now(); // Unique identifier
        rectangle.dataset.id = miniRect.dataset.forRectangle;
        this.updateMinimapRectanglePosition(miniRect, rectangle);
        this.minimap.appendChild(miniRect);
    }

    /**
     * Updates the position and size of a minimap rectangle to match its main rectangle.
     * Converts pixel values to percentages for the minimap representation.
     * @param {HTMLElement} miniRect - The minimap rectangle element
     * @param {HTMLElement} rectangle - The main rectangle element
     */
    updateMinimapRectanglePosition(miniRect, rectangle) {
        const left = parseFloat(rectangle.style.left) / this.canvasWidth * 100;
        const top = parseFloat(rectangle.style.top) / this.canvasHeight * 100;
        const width = parseFloat(rectangle.style.width) / this.canvasWidth * 100;
        const height = parseFloat(rectangle.style.height) / this.canvasHeight * 100;
        miniRect.style.left = `${left}%`;
        miniRect.style.top = `${top}%`;
        miniRect.style.width = `${width}%`;
        miniRect.style.height = `${height}%`;
    }

    /**
     * Updates all minimap rectangles to match their corresponding main rectangles.
     * Uses a Map for efficient lookup of minimap rectangles.
     */
    updateMinimapRectangles() {
        const rectangles = document.querySelectorAll('.rectangle');
        const miniRectangles = document.querySelectorAll('.mini-rectangle');
        const miniMap = new Map();
        miniRectangles.forEach(miniRect => {
            miniMap.set(miniRect.dataset.forRectangle, miniRect);
        });
        rectangles.forEach(rect => {
            const miniRect = miniMap.get(rect.dataset.id);
            if (miniRect) {
                this.updateMinimapRectanglePosition(miniRect, rect);
            }
        });
    }

    /**
     * Updates the minimap viewport indicator to reflect the current pan/zoom state.
     * Calculates the visible portion of the canvas and updates the indicator accordingly.
     */
    updateMinimapViewport() {
        const transform = this.customPanzoom.getTransform();
        const viewportWidth = window.innerWidth / (this.canvasWidth * transform.scale) * 100;
        const viewportHeight = window.innerHeight / (this.canvasHeight * transform.scale) * 100;
        const viewportX = (-transform.x / (this.canvasWidth * transform.scale)) * 100;
        const viewportY = (-transform.y / (this.canvasHeight * transform.scale)) * 100;
        this.viewportIndicator.style.width = `${viewportWidth}%`;
        this.viewportIndicator.style.height = `${viewportHeight}%`;
        this.viewportIndicator.style.left = `${viewportX}%`;
        this.viewportIndicator.style.top = `${viewportY}%`;
    }

    /**
     * Handles click events on the minimap to pan the main canvas.
     * Converts minimap coordinates to canvas coordinates and centers the viewport.
     * @param {MouseEvent} e - The click event
     */
    handleMinimapClick(e) {
        if (e.target !== this.minimap) return;
        const rect = this.minimap.getBoundingClientRect();
        const percentX = (e.clientX - rect.left) / rect.width;
        const percentY = (e.clientY - rect.top) / rect.height;
        const targetX = percentX * this.canvasWidth;
        const targetY = percentY * this.canvasHeight;
        const scale = this.customPanzoom.getTransform().scale;
        const x = (window.innerWidth / 2) - (targetX * scale);
        const y = (window.innerHeight / 2) - (targetY * scale);
        this.customPanzoom.pan(x, y);
        this.updateMinimapViewport();
    }
}

/**
 * Creates and initializes a new MinimapManager instance.
 * @param {Object} options - Configuration options for the minimap
 * @returns {MinimapManager} A new MinimapManager instance
 */
export function setupMinimap(options) {
    const instance = new MinimapManager(options);
    MinimapManager.instance = instance;
    return instance;
}

/**
 * Creates a minimap representation for a rectangle.
 * @param {HTMLElement} rectangle - The rectangle to create a minimap representation for
 */
export function createMinimapRectangle(rectangle) {
    if (!MinimapManager.instance) {
        console.warn('MinimapManager not initialized');
        return;
    }
    MinimapManager.instance.createMinimapRectangle(rectangle);
}

/**
 * Updates all minimap rectangles to match their corresponding main rectangles.
 */
export function updateMinimapRectangles() {
    if (!MinimapManager.instance) {
        console.warn('MinimapManager not initialized');
        return;
    }
    MinimapManager.instance.updateMinimapRectangles();
}

// Store the instance in a WeakMap
MinimapManager.instance = null; 