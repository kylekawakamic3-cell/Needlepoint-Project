import React, { useState, useEffect } from 'react';
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
  const gridRef = React.useRef(null); // Ref to access canvas

  // Settings
  const [complexity, setComplexity] = useState(50); // 1-100
  const [maxColors, setMaxColors] = useState(15);
  const [zoom, setZoom] = useState(1.0);

  const [colorOverrides, setColorOverrides] = useState({}); // { [originalFloss]: targetFloss }

  // Re-process image when complexity changes
  useEffect(() => {
    if (originalImage) {
      const data = processImage(originalImage, complexity);
      setImageData(data);
    }
  }, [originalImage, complexity]);

  const handleImageUpload = (img) => {
    setOriginalImage(img);
    // Reset stats & overrides
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cross Stitch Pattern Converter</h1>
        <p>Convert any image into a cross-stitch pattern with DMC thread matching.</p>
      </header>

      <main className="app-content">
        {!originalImage ? (
          <div className="upload-section">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <div className="editor-container">
            <div className="controls-sidebar">
              <button className="btn-secondary" onClick={() => setOriginalImage(null)}>
                ← Start Over
              </button>

              <div className="control-group">
                <button
                  onClick={handleExportPDF}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ec4899',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  Download PDF Pattern 📄
                </button>
              </div>

              <div className="control-group">
                <label>Complexity / Size</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={complexity}
                  onChange={(e) => setComplexity(parseInt(e.target.value))}
                />
                <span>{complexity}%</span>
              </div>

              <div className="control-group">
                <label>Max Colors (Auto-Reduce)</label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={maxColors}
                  onChange={(e) => setMaxColors(parseInt(e.target.value))}
                />
                <span>{maxColors === 15 ? '15 (Simplified)' : maxColors}</span>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                  Reduces confetti by merging similar colors.
                </p>
              </div>

              <div className="control-group">
                <label>Zoom Level</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                />
                <span>{Math.round(zoom * 100)}%</span>
              </div>

              <MaterialList
                usageData={patternStats}
                colorOverrides={colorOverrides}
                onColorMerge={handleColorMerge}
              />
            </div>

            <div className="pattern-preview">
              {imageData && (
                <PatternGrid
                  imageData={imageData}
                  colorOverrides={colorOverrides}
                  maxColors={maxColors}
                  zoom={zoom}
                  onPatternGenerated={setPatternStats}
                  gridRef={gridRef}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
