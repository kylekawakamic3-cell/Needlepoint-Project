import React, { useState, useEffect, useRef, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import PatternGrid from './components/PatternGrid';
import MaterialList from './components/MaterialList';
import { processImage } from './utils/imageProcessing';
import { generatePDF } from './utils/pdfGenerator';
import './App.css';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [patternStats, setPatternStats] = useState(null);
  const gridRef = useRef(null);

  // Settings
  const [maxColors, setMaxColors] = useState(24);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [complexity, setComplexity] = useState(50);

  // Bottom sheet drag state
  const [panelHeight, setPanelHeight] = useState(50); // percentage of viewport
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;

    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY.current - clientY;
    const viewportHeight = window.innerHeight - 60; // subtract header height
    const deltaPercent = (deltaY / viewportHeight) * 100;

    let newHeight = dragStartHeight.current + deltaPercent;
    // Clamp between 20% and 80%
    newHeight = Math.max(20, Math.min(80, newHeight));
    setPanelHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse/touch listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const [colorOverrides, setColorOverrides] = useState({});

  // Re-process image when complexity changes
  useEffect(() => {
    if (originalImage) {
      const data = processImage(originalImage, complexity);
      setImageData(data);
    }
  }, [originalImage, complexity]);

  const handleImageUpload = (img) => {
    setOriginalImage(img);
    setPatternStats(null);
    setColorOverrides({});
  };

  const handleColorMerge = (originalFloss, targetFloss) => {
    setColorOverrides(prev => ({
      ...prev,
      [originalFloss]: targetFloss
    }));
  };

  const handleExportPDF = () => {
    if (gridRef.current && patternStats) {
      generatePDF(gridRef.current, patternStats);
    }
  };

  const handleRefresh = () => {
    if (originalImage) {
      const data = processImage(originalImage, complexity);
      setImageData(data);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h1>Pattern Gen</h1>
        </div>
        {originalImage && (
          <button className="export-btn" onClick={handleExportPDF}>
            Export
          </button>
        )}
      </header>

      <main className="app-content">
        {!originalImage ? (
          <div className="upload-section">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <>
            <div className="preview-area" style={{ height: `${100 - panelHeight}%` }}>
              <div className="pattern-container">
                {imageData && (
                  <PatternGrid
                    imageData={imageData}
                    colorOverrides={colorOverrides}
                    maxColors={maxColors}
                    zoom={zoom}
                    showGrid={showGrid}
                    onPatternGenerated={setPatternStats}
                    gridRef={gridRef}
                  />
                )}
              </div>
              <button className="refresh-btn" onClick={handleRefresh} title="Refresh pattern">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>

            <div className="controls-panel" style={{ height: `${panelHeight}%` }}>
              <div
                className="panel-handle"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              ></div>
              <h2 className="panel-title">Pattern Controls</h2>

              <div className="control-row">
                <div className="control-header">
                  <span className="control-label">Thread Colors</span>
                  <span className="control-value">{maxColors}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={maxColors}
                  onChange={(e) => setMaxColors(parseInt(e.target.value))}
                />
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Grid Visibility</span>
                  <span className="toggle-description">Overlay 10x10 line guides</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="palette-section">
                <div className="palette-header">
                  <span className="palette-title">Current Palette</span>
                  <a href="#" className="palette-link">DMC Threads</a>
                </div>
                <MaterialList
                  usageData={patternStats}
                  colorOverrides={colorOverrides}
                  onColorMerge={handleColorMerge}
                />
              </div>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button className="btn-secondary" onClick={() => setOriginalImage(null)}>
                  ← Start Over
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
