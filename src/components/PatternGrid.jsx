import React, { useEffect, useRef, useState } from 'react';
import { getPixelColor } from '../utils/imageProcessing';
import { findNearestColor, findNearestGrayColor, reducePalette } from '../utils/colorMatching';

import { dmcColors } from '../utils/dmcData';

const PatternGrid = ({ imageData, settings, colorOverrides, maxColors, onPatternGenerated }) => {
    const canvasRef = useRef(null);
    const [pattern, setPattern] = useState(null);

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const { width, height, data, pixelSize } = imageData;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const displayStitchSize = 10;

        canvas.width = width * displayStitchSize;
        canvas.height = height * displayStitchSize;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pre-calculation pass for Auto-Reduction
        // We need to know all colors first to reduce them.
        // We will store "raw" dmc colors for each pixel in a temp grid to avoid recalculating nearestColor twice.
        const pixelGrid = []; // Array of DMC objects
        const rawCounts = {};

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixel = getPixelColor(data, x, y, width);
                let dmcColor;
                if (settings.blackAndWhite) {
                    dmcColor = findNearestGrayColor(pixel.r, pixel.g, pixel.b);
                } else {
                    dmcColor = findNearestColor(pixel.r, pixel.g, pixel.b);
                }

                // Check for MANUAL overrides first
                if (colorOverrides && colorOverrides[dmcColor.floss]) {
                    const targetFlossId = colorOverrides[dmcColor.floss];
                    const targetColor = dmcColors.find(c => c.floss === targetFlossId);
                    if (targetColor) {
                        dmcColor = targetColor;
                    }
                }

                pixelGrid.push(dmcColor);

                if (!rawCounts[dmcColor.floss]) {
                    rawCounts[dmcColor.floss] = { ...dmcColor, count: 0 };
                }
                rawCounts[dmcColor.floss].count++;
            }
        }

        // Calculate Auto-Reduction Map
        let reductionMap = {};
        if (maxColors && maxColors > 0) {
            reductionMap = reducePalette(rawCounts, maxColors);
        }

        // Second pass: Render
        const finalCounts = {};

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                let dmcColor = pixelGrid[index];

                // Apply Auto-Reduction
                if (reductionMap[dmcColor.floss]) {
                    const targetFlossId = reductionMap[dmcColor.floss];
                    const targetColor = dmcColors.find(c => c.floss === targetFlossId);
                    if (targetColor) {
                        dmcColor = targetColor;
                    }
                }

                // Draw stitch
                ctx.fillStyle = `rgb(${dmcColor.r}, ${dmcColor.g}, ${dmcColor.b})`;
                ctx.fillRect(x * displayStitchSize, y * displayStitchSize, displayStitchSize, displayStitchSize);

                // Optional: Draw grid lines?
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.strokeRect(x * displayStitchSize, y * displayStitchSize, displayStitchSize, displayStitchSize);


                // Count final colors
                if (!finalCounts[dmcColor.floss]) {
                    finalCounts[dmcColor.floss] = { ...dmcColor, count: 0 };
                }
                finalCounts[dmcColor.floss].count++;
            }
        }

        setPattern(pixelGrid);

        // Notify parent with materials
        onPatternGenerated({
            colors: Object.values(finalCounts),
            totalStitches: width * height,
            width,
            height
        });

    }, [imageData, settings]); // Re-run when image or settings change

    return (
        <div className="pattern-grid-wrapper">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default PatternGrid;
