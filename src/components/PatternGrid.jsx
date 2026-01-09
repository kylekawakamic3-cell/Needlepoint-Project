import React, { useEffect, useRef, useState } from 'react';
import { getPixelColor } from '../utils/imageProcessing';
import { findNearestColor, findNearestGrayColor, reducePalette } from '../utils/colorMatching';

import { dmcColors } from '../utils/dmcData';

const PatternGrid = ({ imageData, settings, colorOverrides, maxColors, zoom, onPatternGenerated }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [pattern, setPattern] = useState(null);

    useEffect(() => {
        if (!imageData || !canvasRef.current) return;

        const { width, height, data } = imageData;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // ASPECT-RATIO AWARE AUTO-FIT:
        // We want the pattern to fit within a ~700x700 viewport optimally.
        const viewportSize = 700;
        const scaleW = viewportSize / width;
        const scaleH = viewportSize / height;
        // Use the smaller scale to ensure the whole image fits in the viewfinder
        const displayStitchSize = Math.min(scaleW, scaleH);

        canvas.width = width * displayStitchSize;
        canvas.height = height * displayStitchSize;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pre-calculation pass for Auto-Reduction
        const pixelGrid = []; // Array of DMC objects
        const rawCounts = {};

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixel = getPixelColor(data, x, y, width);

                // GUARD: Check for valid pixel data
                if (pixel.r === undefined || pixel.g === undefined || pixel.b === undefined || isNaN(pixel.r)) {
                    // Default to white or skip
                    pixel.r = 255; pixel.g = 255; pixel.b = 255;
                }

                // Handle transparency
                if (pixel.a < 10) {
                    // transparent, treat as white
                    pixel.r = 255; pixel.g = 255; pixel.b = 255;
                }

                let dmcColor;
                if (settings.blackAndWhite) {
                    dmcColor = findNearestGrayColor(pixel.r, pixel.g, pixel.b);
                } else {
                    dmcColor = findNearestColor(pixel.r, pixel.g, pixel.b);
                }

                // GUARD: Check if dmcColor is valid
                if (!dmcColor) {
                    console.error("No matching DMC color found for:", pixel);
                    continue; // Should likely fallback to a default
                }

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

        let reductionMap = {};
        if (maxColors && maxColors > 0) {
            reductionMap = reducePalette(rawCounts, maxColors);
        }

        const uniqueColorsSet = new Set();
        pixelGrid.forEach(c => {
            const finalFloss = reductionMap[c.floss] || c.floss;
            uniqueColorsSet.add(finalFloss);
        });
        const sortedColors = Array.from(uniqueColorsSet).sort();
        const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*@+".split("");
        const symbolMap = {};
        sortedColors.forEach((floss, i) => {
            symbolMap[floss] = symbols[i % symbols.length];
        });

        const finalCounts = {};

        ctx.font = `${displayStitchSize * 0.7}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                let dmcColor = pixelGrid[index];

                if (reductionMap[dmcColor.floss]) {
                    const targetFlossId = reductionMap[dmcColor.floss];
                    const targetColor = dmcColors.find(c => c.floss === targetFlossId);
                    if (targetColor) {
                        dmcColor = targetColor;
                    }
                }

                ctx.fillStyle = `rgb(${dmcColor.r}, ${dmcColor.g}, ${dmcColor.b})`;
                ctx.fillRect(x * displayStitchSize, y * displayStitchSize, displayStitchSize, displayStitchSize);

                const symbol = symbolMap[dmcColor.floss];
                const brightness = (dmcColor.r * 299 + dmcColor.g * 587 + dmcColor.b * 114) / 1000;
                ctx.fillStyle = brightness > 128 ? 'black' : 'white';
                ctx.fillText(symbol, x * displayStitchSize + displayStitchSize / 2, y * displayStitchSize + displayStitchSize / 2);

                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * displayStitchSize, y * displayStitchSize, displayStitchSize, displayStitchSize);

                if (x % 10 === 0 && x > 0) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.moveTo(x * displayStitchSize, 0);
                    ctx.lineTo(x * displayStitchSize, canvas.height);
                    ctx.stroke();
                }
                if (y % 10 === 0 && y > 0) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.moveTo(0, y * displayStitchSize);
                    ctx.lineTo(canvas.width, y * displayStitchSize);
                    ctx.stroke();
                }

                if (!finalCounts[dmcColor.floss]) {
                    finalCounts[dmcColor.floss] = { ...dmcColor, symbol: symbol, count: 0 };
                }
                finalCounts[dmcColor.floss].count++;
            }
        }

        setPattern(pixelGrid);

        onPatternGenerated({
            colors: Object.values(finalCounts),
            totalStitches: width * height,
            width,
            height
        });

    }, [imageData, settings, colorOverrides, maxColors]);

    return (
        <div className="pattern-grid-wrapper" ref={containerRef}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                minWidth: '100%',
                minHeight: '100%'
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out',
                        boxShadow: '0 0 0 1px #ddd',
                        backgroundColor: 'white'
                    }}
                />
            </div>
        </div>
    );
};

export default PatternGrid;
