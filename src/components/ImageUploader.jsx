
import React, { useCallback } from 'react';

const ImageUploader = ({ onImageUpload }) => {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, [onImageUpload]);

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                onImageUpload(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div
            className="image-uploader"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                transition: 'border-color 0.3s'
            }}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'block' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                    Drag & Drop or Click to Upload
                </div>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    Supports JPG, PNG, GIF
                </p>
            </label>
        </div>
    );
};

export default ImageUploader;
