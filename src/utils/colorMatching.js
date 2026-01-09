
import { dmcColors } from './dmcData';

/**
 * Calculates the Euclidean distance between two colors.
 * @param {Object} c1 - {r, g, b}
 * @param {Object} c2 - {r, g, b}
 */
const colorDistance = (c1, c2) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};

// Memoize or cache results if needed, but for now simple search is fine for 100 colors.
// If list grows to 500+, we might want a k-d tree or octree, but raw loop is acceptable for <1000 items on modern JS engines.

export const findNearestColor = (r, g, b) => {
    let minDistance = Infinity;
    let nearest = dmcColors[0];
    let validMatchFound = false;

    // Validate inputs immediately
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.warn("findNearestColor received NaN:", { r, g, b });
        // Return White as safety default instead of Pink
        return dmcColors.find(c => c.floss === "5200") || nearest;
    }

    for (const dmc of dmcColors) {
        const dist = colorDistance({ r, g, b }, dmc);
        if (!isNaN(dist) && dist < minDistance) {
            minDistance = dist;
            nearest = dmc;
            validMatchFound = true;
        }
    }

    if (!validMatchFound) {
        console.warn("No valid match found for:", { r, g, b }, "Defaulting to:", nearest.description);
    }

    return nearest;
};

export const findNearestGrayColor = (r, g, b) => {
    // Convert input to grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Find nearest color based on grayscale value of the DMC colors.

    let minDistance = Infinity;
    let nearest = dmcColors[0];

    for (const dmc of dmcColors) {
        // Calculate gray for DMC color
        const dmcGray = 0.299 * dmc.r + 0.587 * dmc.g + 0.114 * dmc.b;
        const dist = Math.abs(gray - dmcGray);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = dmc;
        }
    }
    return nearest;
};

/**
 * Reduces a map of color counts to a target maximum size by merging least frequent colors.
 * @param {Object} colorCounts - { [flossId]: { ...colorObj, count: N } }
 * @param {number} maxColors
 * @returns {Object} - { [fromFlossId]: toFlossId } mapping
 */
export const reducePalette = (colorCounts, maxColors) => {
    const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

    if (sorted.length <= maxColors) return {}; // No reduction needed

    const keptColors = sorted.slice(0, maxColors);
    const droppedColors = sorted.slice(maxColors);

    const mapping = {};

    for (const dropped of droppedColors) {
        // Find nearest neighbor in the KEPT list
        let minDistance = Infinity;
        let nearest = keptColors[0];

        for (const kept of keptColors) {
            const dist = colorDistance(dropped, kept);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = kept;
            }
        }
        mapping[dropped.floss] = nearest.floss;
    }

    return mapping;
};
