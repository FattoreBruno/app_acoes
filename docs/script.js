document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const selectFileButton = document.querySelector('button.bg-primary');
    const importFromFileButton = document.querySelectorAll('button.text-gray-400')[0];
    const dropZone = document.querySelector('.border-dashed');
    const imagePrompt = document.getElementById('image-prompt');
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const drawingCtx = drawingCanvas.getContext('2d');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetZoomBtn = document.getElementById('reset-zoom-btn');
    const zoomPercentageInput = document.getElementById('zoom-percentage-input');
    const zoomPercentageContainer = document.getElementById('zoom-percentage-container');
    const zoomControls = document.getElementById('zoom-controls');
    const drawBtn = document.querySelector('button[title="Desenhar"]');
    const eraserBtn = document.querySelector('button[title="Borracha"]');
    const colorPickerBtn = document.getElementById('color-picker-btn');
    const colorPreview = document.getElementById('color-preview');
    const brushSizeSmBtn = document.getElementById('brush-size-sm-btn');
    const brushSizeMdBtn = document.getElementById('brush-size-md-btn');
    const brushSizeLgBtn = document.getElementById('brush-size-lg-btn');

    // Create a hidden file input for images and a color input
    const fileInput = document.createElement('input');
    fileInput.id = 'file-input';
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.style.display = 'none';

    // State
    let currentImage = null;
    let zoom = 1; // This will be a multiplier of fitZoom
    let fitZoom = 1; // The zoom level to fit the image to the canvas
    const ZOOM_STEP = 0.1;
    let currentMode = 'pan'; // pan, draw, erase
    let brushColor = '#FF0000'; // Default red
    let brushSize = 5; // Default medium size
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Panning state
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOffsetX = 0;
    let panOffsetY = 0;

    // Redraws both canvases with the current zoom and pan
    const redrawCanvas = () => {
        if (!currentImage) return;

        const totalZoom = fitZoom * zoom;

        // Clear and redraw the main (image) canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        const scaledWidth = currentImage.width * totalZoom;
        const scaledHeight = currentImage.height * totalZoom;
        const x = (canvas.width - scaledWidth) / 2 + panOffsetX;
        const y = (canvas.height - scaledHeight) / 2 + panOffsetY;
        ctx.translate(x, y);
        ctx.scale(totalZoom, totalZoom);
        ctx.drawImage(currentImage, 0, 0, currentImage.width, currentImage.height);
        ctx.restore();

        updateZoomDisplay();
    };

    // Controls the visibility and animation of the zoom percentage display
    const updateZoomDisplay = () => {
        zoomPercentageInput.value = `${Math.round(zoom * 100)}%`;
        if (zoom === 1) {
            zoomPercentageContainer.classList.remove('h-8', 'my-1');
            zoomPercentageContainer.classList.add('h-0', 'my-0', 'border-none');
            zoomPercentageInput.classList.add('hidden');
        } else {
            zoomPercentageContainer.classList.add('h-8', 'my-1');
            zoomPercentageContainer.classList.remove('h-0', 'my-0', 'border-none');
            zoomPercentageInput.classList.remove('hidden');
        }
    };

    // Function to handle file selection and drawing
    const handleFileSelect = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;

                    const container = canvas.parentElement;
                    [canvas, drawingCanvas].forEach(cnv => {
                        cnv.width = container.clientWidth;
                        cnv.height = container.clientHeight;
                    });

                    // Calculate the best fit zoom
                    const scaleX = canvas.width / img.width;
                    const scaleY = canvas.height / img.height;
                    fitZoom = Math.min(scaleX, scaleY);

                    zoom = 1; // Start at 100% of fitZoom
                    panOffsetX = 0;
                    panOffsetY = 0;

                    // Clear any previous drawings
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                    redrawCanvas();

                    imagePrompt.classList.add('hidden');
                    canvas.classList.remove('hidden');
                    drawingCanvas.classList.remove('hidden');
                    zoomControls.classList.remove('opacity-0');
                    window.imageLoaded = true; // Signal that the image is loaded
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Mode Switching
    drawBtn.addEventListener('click', () => {
        currentMode = currentMode === 'draw' ? 'pan' : 'draw';
        updateCursorAndButtonState();
    });

    eraserBtn.addEventListener('click', () => {
        currentMode = currentMode === 'erase' ? 'pan' : 'erase';
        updateCursorAndButtonState();
    });

    const updateCursorAndButtonState = () => {
        // Reset both buttons
        drawBtn.classList.remove('bg-primary/20', 'text-primary');
        eraserBtn.classList.remove('bg-primary/20', 'text-primary');

        if (currentMode === 'draw') {
            drawBtn.classList.add('bg-primary/20', 'text-primary');
            drawingCanvas.style.cursor = 'crosshair';
        } else if (currentMode === 'erase') {
            eraserBtn.classList.add('bg-primary/20', 'text-primary');
            drawingCanvas.style.cursor = 'crosshair'; // Or a different cursor for eraser
        } else { // pan mode
            drawingCanvas.style.cursor = 'grab';
        }
    };

    // Drawing Logic
    const getTransformedPoint = (x, y) => {
        const totalZoom = fitZoom * zoom;
        const scaledWidth = currentImage.width * totalZoom;
        const scaledHeight = currentImage.height * totalZoom;
        const canvasX = (canvas.width - scaledWidth) / 2 + panOffsetX;
        const canvasY = (canvas.height - scaledHeight) / 2 + panOffsetY;

        // Transform the point from canvas space back to original image space
        const originalX = (x - canvasX) / totalZoom;
        const originalY = (y - canvasY) / totalZoom;

        return { x: originalX, y: originalY };
    };

    const drawOnCanvas = (e) => {
        if (!isDrawing) return;

        const point = getTransformedPoint(e.offsetX, e.offsetY);

        drawingCtx.save(); // Save the clean state

        // Apply the same transformations as the main canvas
        const totalZoom = fitZoom * zoom;
        const scaledWidth = currentImage.width * totalZoom;
        const scaledHeight = currentImage.height * totalZoom;
        const x = (canvas.width - scaledWidth) / 2 + panOffsetX;
        const y = (canvas.height - scaledHeight) / 2 + panOffsetY;
        drawingCtx.translate(x, y);
        drawingCtx.scale(totalZoom, totalZoom);

        // Set composite operation for drawing vs erasing
        drawingCtx.globalCompositeOperation = currentMode === 'erase' ? 'destination-out' : 'source-over';

        // Set brush properties (adjusting for zoom)
        drawingCtx.strokeStyle = brushColor;
        drawingCtx.lineWidth = brushSize / totalZoom; // Make brush size consistent regardless of zoom
        drawingCtx.lineJoin = 'round';
        drawingCtx.lineCap = 'round';

        drawingCtx.beginPath();
        drawingCtx.moveTo(lastX, lastY);
        drawingCtx.lineTo(point.x, point.y);
        drawingCtx.stroke();

        drawingCtx.restore(); // Restore to the clean state

        [lastX, lastY] = [point.x, point.y];
    };

    // Event Listeners for Drawing and Panning
    drawingCanvas.addEventListener('mousedown', (e) => {
        if (currentMode === 'draw' || currentMode === 'erase') {
            isDrawing = true;
            const point = getTransformedPoint(e.offsetX, e.offsetY);
            [lastX, lastY] = [point.x, point.y];
        } else { // pan mode
            isPanning = true;
            panStartX = e.clientX - panOffsetX;
            panStartY = e.clientY - panOffsetY;
            drawingCanvas.style.cursor = 'grabbing';
        }
    });

    drawingCanvas.addEventListener('mousemove', (e) => {
        if ((currentMode === 'draw' || currentMode === 'erase') && isDrawing) {
            drawOnCanvas(e);
        } else if (isPanning) {
            panOffsetX = e.clientX - panStartX;
            panOffsetY = e.clientY - panOffsetY;
            redrawCanvas();
        }
    });

    drawingCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
        if (isPanning) {
            isPanning = false;
            updateCursorAndButtonState();
        }
    });

    drawingCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        if (isPanning) {
            isPanning = false;
            updateCursorAndButtonState();
        }
    });

    // Zoom event listeners
    zoomInBtn.addEventListener('click', () => {
        zoom += ZOOM_STEP;
        redrawCanvas();
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoom > ZOOM_STEP) {
            zoom -= ZOOM_STEP;
            redrawCanvas();
        }
    });

    resetZoomBtn.addEventListener('click', () => {
        zoom = 1;
        panOffsetX = 0;
        panOffsetY = 0;
        redrawCanvas();
        // Don't clear drawing on zoom reset, user might want to keep it
    });

    // Handle manual zoom input
    zoomPercentageInput.addEventListener('blur', () => {
        const newZoom = parseInt(zoomPercentageInput.value.replace('%', ''));
        if (!isNaN(newZoom)) {
            zoom = newZoom / 100;
            redrawCanvas();
        }
    });

    // File handling
    const openFileDialog = () => fileInput.click();
    selectFileButton.addEventListener('click', openFileDialog);
    importFromFileButton.addEventListener('click', openFileDialog);
    fileInput.addEventListener('change', (event) => handleFileSelect(event.target.files[0]));
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('border-primary', 'bg-black/20');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-primary', 'bg-black/20'));
    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-black/20');
        handleFileSelect(event.dataTransfer.files[0]);
    });

    document.body.appendChild(fileInput);
    document.body.appendChild(colorInput);

    // Brush Controls
    colorPickerBtn.addEventListener('click', () => colorInput.click());

    colorInput.addEventListener('input', (e) => {
        brushColor = e.target.value;
        colorPreview.style.backgroundColor = brushColor;
    });

    const updateBrushSizeUI = (selectedSize) => {
        // Reset all buttons
        [brushSizeSmBtn, brushSizeMdBtn, brushSizeLgBtn].forEach(btn => {
            btn.classList.remove('bg-primary/20', 'text-primary');
            btn.querySelector('div').classList.remove('bg-primary');
            btn.querySelector('div').classList.add('bg-gray-300');
        });

        // Activate the selected one
        if (selectedSize === 2) { // Small
            brushSizeSmBtn.classList.add('bg-primary/20', 'text-primary');
            brushSizeSmBtn.querySelector('div').classList.add('bg-primary');
        } else if (selectedSize === 5) { // Medium
            brushSizeMdBtn.classList.add('bg-primary/20', 'text-primary');
            brushSizeMdBtn.querySelector('div').classList.add('bg-primary');
        } else if (selectedSize === 10) { // Large
            brushSizeLgBtn.classList.add('bg-primary/20', 'text-primary');
            brushSizeLgBtn.querySelector('div').classList.add('bg-primary');
        }
    };

    brushSizeSmBtn.addEventListener('click', () => {
        brushSize = 2;
        updateBrushSizeUI(brushSize);
    });
    brushSizeMdBtn.addEventListener('click', () => {
        brushSize = 5;
        updateBrushSizeUI(brushSize);
    });
    brushSizeLgBtn.addEventListener('click', () => {
        brushSize = 10;
        updateBrushSizeUI(brushSize);
    });


    // Initial state
    updateZoomDisplay();
    zoomControls.classList.add('opacity-0');
    updateBrushSizeUI(brushSize); // Set initial brush size UI
});
