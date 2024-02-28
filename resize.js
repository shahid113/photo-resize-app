let image = null;
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let isCropping = false;
let startX, startY, width, height;
const containerWidth = 500;
const containerHeight = 500;

document.getElementById('crop-button').addEventListener('click', function() {
    isCropping = true;
    document.getElementById('crop-button').style.display = 'none';
    document.body.classList.add('crop-cursor');
});


document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        image = new Image();
        image.onload = function() {
            const scaleFactor = Math.min(containerWidth / image.width, containerHeight / image.height);
            canvas.width = image.width * scaleFactor;
            canvas.height = image.height * scaleFactor;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            document.getElementById('crop-button').style.display = 'inline-block';
            document.getElementById('download-button').style.display = 'none';
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

canvas.addEventListener('mousedown', function(event) {
    if (isCropping) {
        startX = event.offsetX;
        startY = event.offsetY;
        canvas.addEventListener('mousemove', cropMove);
        document.getElementById('download-button').style.display = 'none'; // Hide the button when starting to crop
    }
});

canvas.addEventListener('mouseup', function() {
    if (isCropping) {
        canvas.removeEventListener('mousemove', cropMove);
        document.getElementById('download-button').style.display = 'inline-block'; // Display the button when the user finishes cropping
    }
});


function cropMove(event) {
    width = event.offsetX - startX;
    height = event.offsetY - startY;
    drawCrop();
    updateDimensions(width, height);
}

function drawCrop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, width, height);
}

canvas.addEventListener('mouseup', function() {
    if (isCropping) {
        canvas.removeEventListener('mousemove', cropMove);
        document.getElementById('download-button').style.display = 'inline-block';
    }
});

document.getElementById('crop-button').addEventListener('click', function() {
    isCropping = true;
    document.getElementById('crop-button').style.display = 'none';
});

document.getElementById('download-button').addEventListener('click', function() {
    const requiredWidth = parseInt(document.getElementById('width-input').value);
    const requiredHeight = parseInt(document.getElementById('height-input').value);
    const targetSizeKB = parseInt(document.getElementById('size-input').value);
    
    // Calculate original image size
    const originalSizeKB = Math.ceil(image.src.length / 1024);

    if (requiredWidth > 0 && requiredHeight > 0 && targetSizeKB > 0) {
        if (targetSizeKB >= originalSizeKB) {
            alert("Target file size cannot be greater than or equal to the original image size.");
            return;
        }

        const croppedImage = document.createElement('canvas');
        croppedImage.width = requiredWidth;
        croppedImage.height = requiredHeight;
        croppedImage.getContext('2d').drawImage(canvas, startX, startY, width, height, 0, 0, requiredWidth, requiredHeight);

        // Convert target file size to bytes
        const targetSizeBytes = targetSizeKB * 1024;

        // Generate cropped image with desired size and quality
        generateCroppedImageWithSize(croppedImage, targetSizeBytes);
    } else {
        alert('Please enter valid values for width, height, and target file size.');
    }
});

function generateCroppedImageWithSize(croppedImage, targetSizeBytes) {
    let quality = 1; // Initial quality
    let dataURL = croppedImage.toDataURL('image/jpeg', quality);
    let blob = dataURItoBlob(dataURL);

    // Estimate file size
    let estimatedSize = blob.size;
    let sizeDifference = Math.abs(estimatedSize - targetSizeBytes);

    // Adjust quality until the estimated size is close to the target size
    while (sizeDifference > 1000) { // Adjust this threshold as needed
        quality -= 0.05; // Adjust quality by increments of 0.05
        dataURL = croppedImage.toDataURL('image/jpeg', quality);
        blob = dataURItoBlob(dataURL);
        estimatedSize = blob.size;
        sizeDifference = Math.abs(estimatedSize - targetSizeBytes);
    }

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'cropped_image.png';
    downloadLink.click();
}

function updateDimensions(width, height) {
    document.getElementById('width-input').value = Math.abs(width);
    document.getElementById('height-input').value = Math.abs(height);
}

function dataURItoBlob(dataURI) {
    // Convert base64/URLEncoded data component to raw binary data
    const byteString = atob(dataURI.split(',')[1]);

    // Separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // Create a Blob from the ArrayBuffer
    return new Blob([ab], { type: mimeString });
}
