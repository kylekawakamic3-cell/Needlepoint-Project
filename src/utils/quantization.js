
/**
 * Calculates Euclidean distance squared (faster than sqrt for comparison)
 */
const distSq = (c1, c2) => {
    return (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2;
};

/**
 * Perform K-Means clustering to find the dominant centroids.
 * @param {Uint8ClampedArray} data - RGBA pixel data
 * @param {number} k - Number of clusters (centroids)
 * @param {number} maxIterations - Limit iterations for performance
 * @returns {Array} - Array of {r, g, b} centroids
 */
export const quantizeImage = (data, k, maxIterations = 5) => {
    // 1. Gather points (ignore transparent)
    // Optimization: If too many points, sample randomly
    const points = [];
    const step = Math.max(1, Math.floor(data.length / 4 / 2000)); // Target ~2000 points for speed

    for (let i = 0; i < data.length; i += 4 * step) {
        if (data[i + 3] > 128) { // Only opaque
            points.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    if (points.length === 0) return []; // Empty image

    // 2. Initialize Centroids
    // Strategy: K-Means++ or just simple sampling?
    // User wants Black/White structure favored. Let's seed with Black/White if K > 2.
    let centroids = [];
    if (k >= 2) {
        centroids.push({ r: 0, g: 0, b: 0 }); // Black
        centroids.push({ r: 255, g: 255, b: 255 }); // White
    }

    // Fill remaining k with random points from the image
    while (centroids.length < k) {
        const p = points[Math.floor(Math.random() * points.length)];
        centroids.push({ ...p });
    }
    // Trim if we forced too many (unlikely given check)
    if (centroids.length > k) centroids = centroids.slice(0, k);


    // 3. Iteration Loop
    for (let iter = 0; iter < maxIterations; iter++) {
        const clusters = new Array(k).fill(0).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

        let changed = false;

        // Assign points to nearest centroid
        for (const p of points) {
            let minDist = Infinity;
            let clusterIdx = 0;

            for (let i = 0; i < k; i++) {
                const d = distSq(p, centroids[i]);
                if (d < minDist) {
                    minDist = d;
                    clusterIdx = i;
                }
            }

            const cluster = clusters[clusterIdx];
            cluster.r += p.r;
            cluster.g += p.g;
            cluster.b += p.b;
            cluster.count++;
        }

        // Recalculate centroids
        for (let i = 0; i < k; i++) {
            const cluster = clusters[i];
            if (cluster.count === 0) {
                // Orphaned centroid? Re-init with random point
                const p = points[Math.floor(Math.random() * points.length)];
                centroids[i] = { ...p };
                changed = true;
            } else {
                const newR = Math.round(cluster.r / cluster.count);
                const newG = Math.round(cluster.g / cluster.count);
                const newB = Math.round(cluster.b / cluster.count);

                if (newR !== centroids[i].r || newG !== centroids[i].g || newB !== centroids[i].b) {
                    centroids[i] = { r: newR, g: newG, b: newB };
                    changed = true;
                }
            }
        }

        if (!changed) break;
    }

    return centroids;
};
