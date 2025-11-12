document.addEventListener('DOMContentLoaded', () => {
    const selectFileButton = document.querySelector('button.bg-primary');
    const importFromFileButton = document.querySelectorAll('button.text-gray-400')[0];
    const dropZone = document.querySelector('.border-dashed');

    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // Function to handle file selection
    const handleFileSelect = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = 'Selected Image';
                img.className = 'max-h-full max-w-full';

                // Clear the drop zone and append the image
                dropZone.innerHTML = '';
                dropZone.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    };

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
});
