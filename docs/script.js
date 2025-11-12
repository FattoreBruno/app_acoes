document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const selectFileButton = document.querySelector('button.bg-primary');
    const importFromFileButton = document.querySelectorAll('button.text-gray-400')[0];
    const dropZone = document.querySelector('.border-dashed');
    const imagePrompt = document.getElementById('image-prompt');
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetZoomBtn = document.getElementById('reset-zoom-btn');
    const zoomPercentageInput = document.getElementById('zoom-percentage-input');
    const zoomPercentageContainer = document.getElementById('zoom-percentage-container');
    const zoomControls = document.getElementById('zoom-controls');

    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // State
    let currentImage = null;
    let zoom = 1;
    const ZOOM_STEP = 0.1;

    // Panning state
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOffsetX = 0;
    let panOffsetY = 0;

    // Redraws the image on the canvas with the current zoom level
    const redrawCanvas = () => {
        if (!currentImage) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate the scaled dimensions
        const scaledWidth = currentImage.width * zoom;
        const scaledHeight = currentImage.height * zoom;

        // Calculate the top-left position to center the image, including the pan offset
        const x = (canvas.width - scaledWidth) / 2 + panOffsetX;
        const y = (canvas.height - scaledHeight) / 2 + panOffsetY;

        // Draw the image with the new zoom level and pan position
        ctx.drawImage(currentImage, x, y, scaledWidth, scaledHeight);

        // Update the zoom percentage display
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

                    // Set canvas size to its container's size for a responsive view
                    const container = canvas.parentElement;
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;

                    // Reset zoom and pan, then redraw
                    zoom = 1;
                    panOffsetX = 0;
                    panOffsetY = 0;
                    redrawCanvas();

                    // Hide prompt, show canvas, and show zoom controls
                    imagePrompt.classList.add('hidden');
                    canvas.classList.remove('hidden');
                    zoomControls.classList.remove('opacity-0');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Zoom event listeners
    zoomInBtn.addEventListener('click', () => {
        zoom += ZOOM_STEP;
        redrawCanvas();
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoom > ZOOM_STEP) { // Prevent zooming out too far
            zoom -= ZOOM_STEP;
            redrawCanvas();
        }
    });

    resetZoomBtn.addEventListener('click', () => {
        zoom = 1;
        panOffsetX = 0; // Also reset pan on zoom reset
        panOffsetY = 0;
        redrawCanvas();
    });

    // Handle manual zoom input
    zoomPercentageInput.addEventListener('blur', () => {
        const newZoom = parseInt(zoomPercentageInput.value.replace('%', ''));
        if (!isNaN(newZoom)) {
            zoom = newZoom / 100;
            redrawCanvas();
        }
    });

    // Panning event listeners on the canvas
    canvas.addEventListener('mousedown', (e) => {
        isPanning = true;
        panStartX = e.clientX - panOffsetX;
        panStartY = e.clientY - panOffsetY;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            panOffsetX = e.clientX - panStartX;
            panOffsetY = e.clientY - panStartY;
            redrawCanvas();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isPanning = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isPanning = false;
        canvas.style.cursor = 'default';
    });

    // Change cursor to 'grab' when hovering over the canvas with an image
    canvas.addEventListener('mouseover', () => {
        if (currentImage) {
            canvas.style.cursor = 'grab';
        }
    });

    // Trigger file input when buttons are clicked
    const openFileDialog = () => {
        fileInput.click();
    };

    selectFileButton.addEventListener('click', openFileDialog);
    importFromFileButton.addEventListener('click', openFileDialog);

    // Handle file selection from the dialog
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleFileSelect(file);
    });

    // Handle drag and drop
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('border-primary', 'bg-black/20');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-black/20');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-black/20');
        const file = event.dataTransfer.files[0];
        handleFileSelect(file);
    });

    // Append the file input to the body
    document.body.appendChild(fileInput);

    // Hide zoom percentage and controls by default
    updateZoomDisplay();
    zoomControls.classList.add('opacity-0');
});
