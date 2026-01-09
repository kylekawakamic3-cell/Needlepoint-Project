
/**
 * Pixelates an image based on the given complexity (scale).
 * @param {HTMLImageElement} image - The source image.
 * @param {number} complexity - The "pixel size" or grid size. 
 *                              Higher complexity = smaller pixels (more detail).
 *                              Let's say complexity is between 10 (coarse) and 100 (fine).
 *                              We can map this to pixel size.
 * @returns {Object} - { width, height, data: Uint8ClampedArray } containing pixel RGB data.
 */
export const processImage = (image, complexity) => {
    // Complexity 1-100.
    // 1 = very blocky (large pixels), 100 = original detailed (small pixels).
    // Let's define "pixelSize" (the size of one 'stitch').
    // Map complexity to pixelSize.
    // e.g. Complexity 100 -> pixelSize 2
    //      Complexity 1 -> pixelSize 20

    // Invert complexity for pixel size:
    const maxPixelSize = 25;
    const minPixelSize = 1; // 1-1 mapping

    // If complexity is 0-100
    const normalizedComplexity = Math.max(1, Math.min(100, complexity));
    // Linear interpolation? or maybe just simple division
    // Higher complexity => smaller pixel size
    const pixelSize = Math.max(minPixelSize, Math.floor(maxPixelSize - ((normalizedComplexity / 100) * (maxPixelSize - minPixelSize))));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate grid dimensions
    const cols = Math.floor(image.width / pixelSize);
    const rows = Math.floor(image.height / pixelSize);

    // Set canvas to the "grid" size (small)
    canvas.width = cols;
    canvas.height = rows;

    // Draw image scaled down
    ctx.drawImage(image, 0, 0, cols, rows);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, cols, rows);

    return {
        width: cols,
        height: rows,
        pixelSize: pixelSize, // Return this so we can scale up for display
        data: imageData.data // RGBA array
    };
};

export const getPixelColor = (data, x, y, width) => {
    const index = (y * width + x) * 4;
    return {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2],
        a: data[index + 3]
    };
};
