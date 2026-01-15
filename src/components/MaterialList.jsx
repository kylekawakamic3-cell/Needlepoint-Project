import React from 'react';

const MaterialList = ({ usageData, colorOverrides, onColorMerge }) => {
    if (!usageData) return null;

    const { colors, totalStitches } = usageData;

    // Sort by count descending
    const sortedColors = [...colors].sort((a, b) => b.count - a.count);

    return (
        <div className="thread-list">
            {sortedColors.map(c => {
                const percentage = Math.round((c.count / totalStitches) * 100);
                const stitchDisplay = c.count >= 1000
                    ? `${(c.count / 1000).toFixed(1).replace(/\.0$/, ',')}${c.count % 1000 === 0 ? '000' : (c.count % 1000).toString().padStart(3, '0')} sts`
                    : `${c.count.toLocaleString()} sts`;

                return (
                    <div key={c.floss} className="thread-item">
                        <div
                            className="thread-color-badge"
                            style={{ backgroundColor: `rgb(${c.r}, ${c.g}, ${c.b})` }}
                        />
                        <div className="thread-info">
                            <div className="thread-name">DMC {c.floss}</div>
                            <div className="thread-description">{c.description}</div>
                        </div>
                        <div className="thread-stats">
                            <div className="thread-percentage">{percentage}%</div>
                            <div className="thread-count">{c.count.toLocaleString()} sts</div>
                        </div>
                        <span className="thread-arrow">›</span>
                    </div>
                );
            })}
        </div>
    );
};

export default MaterialList;
