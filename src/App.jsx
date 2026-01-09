
import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import PatternGrid from './components/PatternGrid';
import MaterialList from './components/MaterialList';
import { processImage } from './utils/imageProcessing';
import './App.css';

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [patternStats, setPatternStats] = useState(null);

  // Settings
  const [complexity, setComplexity] = useState(50); // 1-100
  const [maxColors, setMaxColors] = useState(15);
  const [blackAndWhite, setBlackAndWhite] = useState(false);

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Needlepoint Pattern Converter</h1>
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
                <label>
                  <input
                    type="checkbox"
                    checked={blackAndWhite}
                    onChange={(e) => setBlackAndWhite(e.target.checked)}
                  />
                  Black & White Mode
                </label>
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
                  settings={{ blackAndWhite }}
                  colorOverrides={colorOverrides}
                  maxColors={maxColors}
                  onPatternGenerated={setPatternStats}
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
