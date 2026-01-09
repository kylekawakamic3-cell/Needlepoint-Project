
import React, { useState } from 'react';
import { dmcColors } from '../utils/dmcData';
import { findNearestColor } from '../utils/colorMatching';
import { hexToRgb } from '../utils/hexToRgb';

const MaterialList = ({ usageData, colorOverrides, onColorMerge }) => {
    // isEditMode toggle is less relevant if we just allow clicking the color to edit?
    // But keeping it avoids accidental clicks.
    const [isEditMode, setIsEditMode] = useState(false);

    if (!usageData) return null;

    const { colors, totalStitches } = usageData;

    // Filter out colors that have been fully merged away (count 0 or overridden)
    // Actually patternGrid handles the counts based on overrides, so if "colors" comes from PatternGrid, it should already reflect changes?
    // Wait, PatternGrid recalculates colorCounts based on the *rendered* pixels.
    // So if A overrides B, PatternGrid loops, sees A, draws B, increments B's count.
    // So "colors" prop here ALREADY reflects the merged state.
    // BUT we need to see the "original" list? No, we see the current list.
    // If I merge 3713 -> 761, 3713 disappears from the view. 
    // That's good. But how do I "undo" or see what's happening?
    // For V1, disappearance is fine.

    // Sort by count descending
    const sortedColors = [...colors].sort((a, b) => b.count - a.count);

    const hours = (totalStitches / 100).toFixed(1);

    const handleColorPick = (e, originalFloss) => {
        const hex = e.target.value;
        const rgb = hexToRgb(hex);
        if (rgb) {
            const nearestDMC = findNearestColor(rgb.r, rgb.g, rgb.b);
            if (nearestDMC && nearestDMC.floss !== originalFloss) {
                if (onColorMerge) {
                    onColorMerge(originalFloss, nearestDMC.floss);
                }
            }
        }
    };

    return (
        <div className="material-list" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h2>Pattern Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="stat-box">
                    <strong>Total Stitches</strong>
                    <p style={{ fontSize: '1.5rem', margin: '5px 0' }}>{totalStitches.toLocaleString()}</p>
                </div>
                <div className="stat-box">
                    <strong>Est. Time</strong>
                    <p style={{ fontSize: '1.5rem', margin: '5px 0' }}>{hours} hrs</p>
                    <small>@ 100 stitches/hr</small>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Materials Needed</h3>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        background: isEditMode ? '#ec4899' : '#eee',
                        color: isEditMode ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                >
                    {isEditMode ? 'Done Editing' : 'Edit Colors'}
                </button>
            </div>
            <p><strong>Total Colors:</strong> {sortedColors.length}</p>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Color</th>
                            <th style={{ padding: '8px' }}>Symbol</th>
                            <th style={{ padding: '8px' }}>DMC #</th>
                            <th style={{ padding: '8px' }}>Name</th>
                            <th style={{ padding: '8px' }}>Stitches</th>
                            <th style={{ padding: '8px' }}>Skeins</th>
                            {isEditMode && <th style={{ padding: '8px' }}>Edit</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedColors.map(c => {
                            const skeins = Math.ceil(c.count / 2000);

                            return (
                                <tr key={c.floss} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})`,
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }} title={c.hex}></div>
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <span className="thread-symbol">{c.symbol}</span>
                                    </td>
                                    <td style={{ padding: '8px' }}>{c.floss}</td>
                                    <td style={{ padding: '8px' }}>{c.description}</td>
                                    <td style={{ padding: '8px' }}>{c.count}</td>
                                    <td style={{ padding: '8px' }}>{skeins}</td>
                                    {isEditMode && (
                                        <td style={{ padding: '8px' }}>
                                            <div style={{ position: 'relative', width: '24px', height: '24px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>
                                                <input
                                                    type="color"
                                                    defaultValue={`#${c.hex}`}
                                                    onChange={(e) => handleColorPick(e, c.floss)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-50%',
                                                        left: '-50%',
                                                        width: '200%',
                                                        height: '200%',
                                                        padding: 0,
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Pick a new color to find nearest DMC match"
                                                />
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>
                *Skein estimates assume standard 6-strand floss used as 2 strands on 14-count aida.
            </p>
        </div>
    );
};

export default MaterialList;
