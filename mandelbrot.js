let canvas = document.getElementById('mandelbrotCanvas');
let ctx = canvas.getContext('2d');
let imgData = ctx.createImageData(canvas.width, canvas.height);

let view = {
    x: -2.0,
    y: -1.5,
    zoom: 2.5,
    maxIterations: 100
};

function mandelbrot(c, maxIter) {
    let z = {re: 0, im: 0};
    for (let i = 0; i < maxIter; i++) {
        let re = z.re * z.re - z.im * z.im + c.re;
        let im = 2 * z.re * z.im + c.im;
        if (re * re + im * im > 4) return i;
        z.re = re;
        z.im = im;
    }
    return maxIter;
}

function draw() {
    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            let c = {
                re: view.x + (x / canvas.width) * view.zoom,
                im: view.y + (y / canvas.height) * view.zoom
            };
            let m = mandelbrot(c, view.maxIterations);
            let color = hslToRgb(m / view.maxIterations * 360, 1, m === view.maxIterations ? 0 : 0.5);
            let index = (y * canvas.width + x) * 4;
            imgData.data[index] = color[0];
            imgData.data[index + 1] = color[1];
            imgData.data[index + 2] = color[2];
            imgData.data[index + 3] = 255; // Alpha
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function zoomIn() {
    view.zoom *= 0.8;
    draw();
}

function zoomOut() {
    view.zoom /= 0.8;
    draw();
}

function resetView() {
    view = {
        x: -2.0,
        y: -1.5,
        zoom: 2.5,
        maxIterations: 100
    };
    draw();
}

draw(); // Initial draw