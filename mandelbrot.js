const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');

let minX = -2;
let maxX = 1;
let minY = -1.5;
let maxY = 1.5;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawMandelbrot();
}

function handleZoom(e, zoomIn) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const zoomFactor = zoomIn ? 0.5 : 2;
    
    // Convert click coordinates to complex plane
    const clickX = minX + (maxX - minX) * (x / canvas.width);
    const clickY = minY + (maxY - minY) * (y / canvas.height);
    
    // Calculate new bounds
    const newWidth = (maxX - minX) * zoomFactor;
    const newHeight = (maxY - minY) * zoomFactor;
    
    minX = clickX - newWidth / 2;
    maxX = clickX + newWidth / 2;
    minY = clickY - newHeight / 2;
    maxY = clickY + newHeight / 2;
    
    drawMandelbrot();
}

function drawMandelbrot() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const cReal = minX + (maxX - minX) * (x / canvas.width);
            const cImag = minY + (maxY - minY) * (y / canvas.height);
            
            let zReal = 0;
            let zImag = 0;
            let iteration = 0;
            const maxIterations = 1000;
            
            while (zReal * zReal + zImag * zImag < 4 && iteration < maxIterations) {
                const nextZReal = zReal * zReal - zImag * zImag + cReal;
                const nextZImag = 2 * zReal * zImag + cImag;
                zReal = nextZReal;
                zImag = nextZImag;
                iteration++;
            }
            
            const i = (y * canvas.width + x) * 4;
            if (iteration === maxIterations) {
                data[i] = data[i + 1] = data[i + 2] = 0;
            } else {
                const hue = iteration / maxIterations * 360;
                const [r, g, b] = hslToRgb(hue/360, 1, 0.5);
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
            data[i + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
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