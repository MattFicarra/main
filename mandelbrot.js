const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');

let minX = -2;
let maxX = 1;
let minY = -1.5;
let maxY = 1.5;
let isDrawing = false;
let resizeTimeout;
const BASE_SIZE = 800; // Fixed reference size

function resizeCanvas() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        
        // Maintain aspect ratio in the mathematical space
        const ratio = window.innerWidth / window.innerHeight;
        const mathHeight = (maxX - minX) / ratio;
        const centerY = (maxY + minY) / 2;
        minY = centerY - mathHeight / 2;
        maxY = centerY + mathHeight / 2;
        
        drawMandelbrot(true);
    }, 100);
}

function handleZoom(e, zoomIn) {
    e.preventDefault();
    if (isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const zoomFactor = zoomIn ? 0.5 : 2;
    
    // Calculate new boundaries
    const clickX = minX + (maxX - minX) * (x / canvas.width);
    const clickY = minY + (maxY - minY) * (y / canvas.height);
    
    const newWidth = (maxX - minX) * zoomFactor;
    const newHeight = (maxY - minY) * zoomFactor;
    
    minX = clickX - newWidth / 2;
    maxX = clickX + newWidth / 2;
    minY = clickY - newHeight / 2;
    maxY = clickY + newHeight / 2;
    
    // First do a quick render
    drawMandelbrot(true);
    // Then do a full quality render
    requestAnimationFrame(() => drawMandelbrot(false));
}

function drawMandelbrot(isPreview = false) {
    console.log('Starting render:', isPreview ? 'preview' : 'full');
    isDrawing = true;
    const blockSize = isPreview ? 4 : 1;
    const maxIterations = isPreview ? 100 : 1000;
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    const widthRatio = (maxX - minX) / canvas.width;
    const heightRatio = (maxY - minY) / canvas.height;
    
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('Coordinate range:', minX, maxX, minY, maxY);
    
    // Fixed the y < canvas.height condition (was using x)
    for (let x = 0; x < canvas.width; x += blockSize) {
        for (let y = 0; y < canvas.height; y += blockSize) {
            const cReal = minX + x * widthRatio;
            const cImag = minY + y * heightRatio;
            
            const iterations = calculateIterations(cReal, cImag, maxIterations);
            
            // Fill the block
            for (let dx = 0; dx < blockSize && (x + dx) < canvas.width; dx++) {
                for (let dy = 0; dy < blockSize && (y + dy) < canvas.height; dy++) {
                    setPixelColor(x + dx, y + dy, iterations, data);
                }
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    console.log('Render complete');
    isDrawing = false;
    
    if (isPreview) {
        setTimeout(() => requestAnimationFrame(() => drawMandelbrot(false)), 50);
    }
}

// Remove or comment out the drawMandelbrotProgressive function for now
// ...rest of existing code...

function isInMainCardioidOrBulb(x, y) {
    // Check if point is in main cardioid
    const q = (x - 0.25)**2 + y*y;
    if (q * (q + (x - 0.25)) <= 0.25 * y*y) {
        return true;
    }
    
    // Check if point is in period-2 bulb
    if ((x + 1)**2 + y*y <= 0.0625) {
        return true;
    }
    
    return false;
}

function calculateIterations(cReal, cImag, maxIterations) {
    // Early escape for main cardioid and period-2 bulb
    if (isInMainCardioidOrBulb(cReal, cImag)) {
        return maxIterations;
    }

    let zReal = 0;
    let zImag = 0;
    
    // For derivative calculation
    let dzReal = 0;
    let dzImag = 0;
    
    let iteration = 0;
    let smoothIter = 0;
    
    while (zReal * zReal + zImag * zImag < 4 && iteration < maxIterations) {
        // Calculate derivative (chain rule): dz = 2*z*dz + 1
        const tempDzReal = 2.0 * (zReal * dzReal - zImag * dzImag) + 1.0;
        const tempDzImag = 2.0 * (zReal * dzImag + zImag * dzReal);
        
        // Standard iteration
        const nextZReal = zReal * zReal - zImag * zImag + cReal;
        const nextZImag = 2 * zReal * zImag + cImag;
        
        zReal = nextZReal;
        zImag = nextZImag;
        dzReal = tempDzReal;
        dzImag = tempDzImag;
        
        iteration++;
        
        // Estimate if we're near a boundary using the derivative
        const derMagnitude = Math.sqrt(dzReal * dzReal + dzImag * dzImag);
        if (derMagnitude > 1e10) break; // Early escape on high-derivative areas
    }
    
    if (iteration < maxIterations) {
        // Smooth iteration count using logarithm
        const zn = Math.sqrt(zReal * zReal + zImag * zImag);
        smoothIter = iteration + 1 - Math.log(Math.log(zn)) / Math.log(2);
        return smoothIter;
    }
    
    return iteration;
}

function setPixelColor(x, y, iteration, data) {
    const i = (y * canvas.width + x) * 4;
    if (iteration === maxIterations) {
        data[i] = data[i + 1] = data[i + 2] = 0;
    } else {
        // Use smooth coloring based on fractional iteration count
        const hue = (iteration % 360) / 360;
        const saturation = 1;
        const lightness = 0.5 * (1 + Math.sin(Math.PI * iteration / 50));
        const [r, g, b] = hslToRgb(hue, saturation, lightness);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    data[i + 3] = 255;
}

function fillBlock(startX, startY, size, iteration, data) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            setPixelColor(startX + x, startY + y, iteration, data);
        }
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('click', (e) => handleZoom(e, true));
canvas.addEventListener('contextmenu', (e) => handleZoom(e, false));

// Initial render
resizeCanvas();