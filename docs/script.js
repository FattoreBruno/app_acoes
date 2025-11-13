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
    const drawBtn = document.getElementById('draw-tool-btn');
    const eraserBtn = document.querySelector('button[title="Borracha"]');
    const pencilMenu = document.getElementById('pencil-menu');
    const pencilTypeButtons = document.querySelectorAll('.grid-cols-5 > button[title]');
    const sizeSlider = document.getElementById('size-slider');
    const sizeSliderValue = document.querySelector('input[id="size-slider"] + span');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacitySliderValue = document.querySelector('input[id="opacity-slider"] + span');
    const colorSwatches = document.querySelectorAll('.grid-cols-10 > button');
    const hexInput = document.getElementById('hex-input');
    const rInput = document.getElementById('r-input');
    const gInput = document.getElementById('g-input');
    const bInput = document.getElementById('b-input');
    const addCustomColorBtn = document.getElementById('add-custom-color-btn');
    const customColorsContainer = document.getElementById('custom-colors-container');

    // Custom Colors State
    const MAX_CUSTOM_COLORS = 10;
    let customColors = [];
    const defaultSwatchColors = Array.from(colorSwatches).map(swatch => rgbToHex(window.getComputedStyle(swatch).backgroundColor));

    // Create a hidden file input for images
    const fileInput = document.createElement('input');
    fileInput.id = 'file-input';
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // State
    let currentImage = null;
    let zoom = 1; // This will be a multiplier of fitZoom
    let fitZoom = 1; // The zoom level to fit the image to the canvas
    const ZOOM_STEP = 0.1;
    let currentMode = 'pan'; // pan, draw, erase
    let brushColor = '#FF0000'; // Default red
    let brushSize = 5; // Default medium size
    let brushOpacity = 1; // Default opacity
    let currentPencil = 'fina'; // Default pencil type
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
        pencilMenu.classList.toggle('hidden');
    });

    eraserBtn.addEventListener('click', () => {
        currentMode = currentMode === 'erase' ? 'pan' : 'erase';
        pencilMenu.classList.add('hidden'); // Always hide pencil menu in erase mode
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
        drawingCtx.globalAlpha = brushOpacity;

        // Set brush properties (adjusting for zoom)
        drawingCtx.strokeStyle = brushColor;
        drawingCtx.lineWidth = brushSize / totalZoom; // Make brush size consistent regardless of zoom
        drawingCtx.lineJoin = 'round';
        drawingCtx.lineCap = 'round';

        if (currentPencil === 'spray') {
            drawingCtx.fillStyle = brushColor;
            for (let i = 0; i < 10; i++) {
                const offsetX = Math.random() * brushSize - brushSize / 2;
                const offsetY = Math.random() * brushSize - brushSize / 2;
                if (Math.sqrt(offsetX * offsetX + offsetY * offsetY) <= brushSize / 2) {
                    drawingCtx.beginPath();
                    drawingCtx.arc(point.x + offsetX, point.y + offsetY, 1, 0, Math.PI * 2);
                    drawingCtx.fill();
                }
            }
        } else {
            drawingCtx.beginPath();
            drawingCtx.moveTo(lastX, lastY);
            drawingCtx.lineTo(point.x, point.y);
            drawingCtx.stroke();
        }

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
        if (isDrawing && currentMode === 'draw') {
            addCustomColor(brushColor);
        }
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

    // Pencil Menu Logic
    const togglePencilMenu = () => {
        pencilMenu.classList.toggle('hidden');
    };

    const makeDraggable = (element) => {
        let isDragging = false;
        let offsetX, offsetY;

        const onMouseDown = (e) => {
            // Only drag if the clicked element is the menu itself, not its content
            if (e.target === element) {
                isDragging = true;
                offsetX = e.clientX - element.getBoundingClientRect().left;
                offsetY = e.clientY - element.getBoundingClientRect().top;
                element.style.cursor = 'grabbing';
            }
        };

        const onMouseMove = (e) => {
            if (isDragging) {
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
                // Remove transform to prevent conflicts with new position
                element.style.transform = '';
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            element.style.cursor = 'move';
        };

        element.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    makeDraggable(pencilMenu);

    pencilTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            pencilTypeButtons.forEach(btn => {
                btn.classList.remove('bg-primary/20', 'text-primary');
                btn.querySelector('span:last-child').classList.remove('font-bold');
            });
            button.classList.add('bg-primary/20', 'text-primary');
            button.querySelector('span:last-child').classList.add('font-bold');

            const pencilTitle = button.title.toLowerCase();
            if (pencilTitle.includes('fina')) currentPencil = 'fina';
            else if (pencilTitle.includes('marcador')) currentPencil = 'marcador';
            else if (pencilTitle.includes('pincel')) currentPencil = 'pincel';
            else if (pencilTitle.includes('spray')) currentPencil = 'spray';

            // You can also set default values here if you want
        });
    });

    sizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
        sizeSliderValue.textContent = brushSize;
    });

    opacitySlider.addEventListener('input', (e) => {
        brushOpacity = e.target.value / 100;
        opacitySliderValue.textContent = `${e.target.value}%`;
    });

    // Initial state
    updateZoomDisplay();
    zoomControls.classList.add('opacity-0');

    // Alwan Color Picker Initialization
    const alwan = new Alwan('#color-picker-container', {
        theme: 'dark',
        popover: false, // Make the picker inline
        inputs: {
            hex: '#hex-input',
            rgb: {
                r: '#r-input',
                g: '#g-input',
                b: '#b-input'
            }
        },
        format: 'hex',
        color: '#EF4444' // Initial color
    });

    // Function to convert rgb string to hex
    const rgbToHex = (rgb) => {
        if (!rgb || !rgb.match(/\d+/g)) return '#000000';
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    };

    // --- Custom Colors Logic ---

    const renderCustomColors = () => {
        customColorsContainer.innerHTML = '';
        customColors.forEach(color => {
            const colorButton = document.createElement('button');
            colorButton.className = 'group relative';
            colorButton.innerHTML = `
                <div class="h-6 w-6 rounded-full ring-1 ring-white/20" style="background-color: ${color};"></div>
                <button class="absolute -top-1 -right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 remove-custom-color-btn" title="Remover cor" data-color="${color}">
                    <span class="material-symbols-outlined text-[10px]">close</span>
                </button>
            `;
            colorButton.querySelector('.h-6.w-6').addEventListener('click', () => {
                alwan.setColor(color, true);
            });
            customColorsContainer.appendChild(colorButton);
        });
    };

    const loadCustomColors = () => {
        const savedColors = localStorage.getItem('customColors');
        if (savedColors) {
            customColors = JSON.parse(savedColors);
        }
        renderCustomColors();
    };

    const saveCustomColors = () => {
        localStorage.setItem('customColors', JSON.stringify(customColors));
    };

    const addCustomColor = (color) => {
        // Convert the input color (which can be rgba) to HEX for consistent comparison
        const hexColor = rgbToHex(color).toUpperCase();

        if (hexColor && !customColors.includes(hexColor) && !defaultSwatchColors.includes(hexColor)) {
            customColors.unshift(hexColor);
            if (customColors.length > MAX_CUSTOM_COLORS) {
                customColors.pop();
            }
            saveCustomColors();
            renderCustomColors();
        }
    };

    customColorsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-custom-color-btn');
        if (removeBtn) {
            const colorToRemove = removeBtn.dataset.color;
            customColors = customColors.filter(color => color !== colorToRemove);
            saveCustomColors();
            renderCustomColors();
        }
    });

    // Sync color swatches with the color picker
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            // Remove ring from all swatches
            colorSwatches.forEach(s => s.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background-dark/80'));
            // Add ring to the clicked swatch
            swatch.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background-dark/80');

            const color = window.getComputedStyle(swatch).backgroundColor;
            // Set the color in Alwan. The 'true' argument dispatches the 'color' event.
            alwan.setColor(color, true);
        });
    });

    // Listen for color changes from Alwan (e.g., from dragging on the palette)
    alwan.on('color', (color) => {
        // Update the brush color state
        brushColor = color.rgba;

        // The 'inputs' option in Alwan's config should handle these automatically,
        // but we can ensure they are correct here if needed.
        hexInput.value = color.hex.toUpperCase();
        rInput.value = color.rgb.r;
        gInput.value = color.rgb.g;
        bInput.value = color.rgb.b;

        // Find the swatch that matches the new color and give it a ring
        let matched = false;
        colorSwatches.forEach(swatch => {
            const swatchHex = rgbToHex(window.getComputedStyle(swatch).backgroundColor);
            if (swatchHex === color.hex.toUpperCase()) {
                swatch.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background-dark/80');
                matched = true;
            } else {
                swatch.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background-dark/80');
            }
        });

        // If no swatch matches, remove all rings
        if (!matched) {
            colorSwatches.forEach(s => s.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background-dark/80'));
        }
    });

    // Initial Load
    loadCustomColors();
});
