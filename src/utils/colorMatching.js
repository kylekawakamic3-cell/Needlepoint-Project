
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

// findNearestGrayColor removed as Black & White mode is deprecated

/**
 * Reduces a map of color counts to a target maximum size by merging least frequent colors.
 * @param {Object} colorCounts - { [flossId]: { ...colorObj, count: N } }
 * @param {number} maxColors
 * @returns {Object} - { [fromFlossId]: toFlossId } mapping
 */
/**
 * Reduces a map of color counts to a target maximum size by merging least frequent colors.
 * PRIORITIZES CORE COLORS (Black, White, CMYK) to ensure a vibrant base.
 * @param {Object} colorCounts - { [flossId]: { ...colorObj, count: N } }
 * @param {number} maxColors
 * @returns {Object} - { [fromFlossId]: toFlossId } mapping
 */
export const reducePalette = (colorCounts, maxColors) => {
    // 1. Identify Core Colors (CMYK + BW)
    const CORE_PALETTE_IDS = [
        "310",  // Black
        "5200", // White (Snow White)
        "996",  // Cyan (Electric Blue Medium)
        "602",  // Magenta (Cranberry) - Vibrant Pink/Purple
        "444",  // Yellow (Lemon Dark)
    ];

    // Get all available colors from the inputs
    const availableFlossIds = Object.keys(colorCounts);

    // 2. Separate Core Colors that appear in the image (or force them if we want strictly posterized)
    // The user wants to "START with CMYK and white". 
    // So we should force keep them if they exist in valid set, or just ensure they are the 'buckets' we map to.

    // Actually, to make them "prioritized", we must decide:
    // Do we force these 5 colors to take up 5 slots of 'maxColors'?
    // Yes, that seems to be the user's intent: "By default we should always start with CMYK and white".

    // Find matching Core Objects from dmcData (we need to look them up if not in colorCounts)
    // But reducePalette only knows about `colorCounts` passed in.
    // If the image doesn't *have* pure Cyan, `colorCounts` won't have it. 
    // We need to fetch them from `dmcColors` import. 

    // For simplicity, let's assume we filter the *existing* image colors. 
    // BUT the user says "prioritize... add CMYK based on which colors are most prevelant".
    // "By default we should always start with CMYK and white".

    // Strategy:
    // 1. Always keep the Core Colors if they are present in the *top X* or just force them?
    // Let's force them into the "Kept" list if we can find them in the global list, 
    // effectively "injecting" them as valid targets even if the image didn't have them originally?
    // No, `colorCounts` implies what's on the grid. If we introduce a color not in `colorCounts`, 
    // we must map existing pixels to it.

    // However, `reducePalette` returns a MAPPING. 
    // If we return { "SomeGray": "310" }, then "SomeGray" becomes Black.
    // The target "310" doesn't strictly need to be in `colorCounts` original keys, 
    // but it's safer if it is. 

    // Refined Strategy:
    // 1. Select the Top (maxColors - 5) most frequent colors from the image.
    // 2. ALWAYS add the 5 Core Colors to the "Kept" list (looking them up in dmcColors if needed).
    // 3. Map everything else to this combined list.

    const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

    // Initial List of Target Colors
    let keptColors = [];

    // Attempt to find Core Colors in dmcData
    const coreColors = CORE_PALETTE_IDS.map(id => dmcColors.find(c => c.floss === id)).filter(Boolean);

    // Add Core Colors to kept list (deduplicating later)
    keptColors.push(...coreColors);

    // Fill remaining slots
    // We want total `maxColors`. We already have `coreColors.length` (up to 5).
    // So we need `maxColors - coreColors.length` from the sorted image colors.

    const slotsRemaining = Math.max(0, maxColors - keptColors.length);

    // Filter out colors already in keptColors to avoid dupes
    const candidates = sorted.filter(c => !keptColors.some(k => k.floss === c.floss));

    // Take top remaining
    keptColors.push(...candidates.slice(0, slotsRemaining));

    // Ensure we don't exceed maxColors (in case maxColors < 5)
    // If maxColors is very small (e.g. 2), we prioritize Black & White.
    if (keptColors.length > maxColors) {
        // Priority: Black, White, then others.
        // Let's just slice, assuming Core Colors are at front.
        keptColors = keptColors.slice(0, maxColors);
    }

    const mapping = {};
    const keptFlossIds = new Set(keptColors.map(c => c.floss));

    // Map all input colors to the nearest Kept Color
    const allInputColors = Object.values(colorCounts);

    for (const color of allInputColors) {
        // If it's already kept, no mapping needed (or map to self)
        if (keptFlossIds.has(color.floss)) continue;

        let minDistance = Infinity;
        let nearest = keptColors[0];

        for (const target of keptColors) {
            const dist = colorDistance(color, target);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = target;
            }
        }
        mapping[color.floss] = nearest.floss;
    }

    return mapping;
};
