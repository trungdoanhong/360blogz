'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
  onClose: () => void;
  onImageUploaded: (imageUrl: string, width?: number, height?: number) => void;
}

interface ImageSize {
  maxWidth: number;
  maxHeight: number;
  label: string;
}

export default function ImageUploadModal({ onClose, onImageUploaded }: ImageUploadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageSize, setImageSize] = useState<'original' | 'small' | 'medium' | 'large' | 'custom'>('medium');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  const imageSizes: Record<string, ImageSize> = {
    small: { maxWidth: 256, maxHeight: 256, label: 'Small (max 256px)' },
    medium: { maxWidth: 512, maxHeight: 512, label: 'Medium (max 512px)' },
    large: { maxWidth: 1024, maxHeight: 1024, label: 'Large (max 1024px)' },
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculateDimensions = useCallback((maxWidth: number, maxHeight: number, originalWidth: number, originalHeight: number) => {
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    };
  }, []);

  const resizeImage = useCallback(async (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob'));
              return;
            }
            // Create new file from blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          },
          file.type,
          0.9  // Quality setting for JPEG
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Get original image dimensions
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        setOriginalAspectRatio(ratio);
        setOriginalDimensions({ width: img.width, height: img.height });
        
        // Set initial custom dimensions based on medium size
        const { width, height } = calculateDimensions(512, 512, img.width, img.height);
        setCustomWidth(width.toString());
        setCustomHeight(height.toString());
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const updateDimension = useCallback((dimension: 'width' | 'height', value: string) => {
    if (!originalAspectRatio || !originalDimensions) return;

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) {
      if (dimension === 'width') {
        setCustomWidth(value);
      } else {
        setCustomHeight(value);
      }
      return;
    }

    if (dimension === 'width') {
      const newHeight = Math.round(numValue / originalAspectRatio);
      setCustomWidth(value);
      setCustomHeight(newHeight.toString());
    } else {
      const newWidth = Math.round(numValue * originalAspectRatio);
      setCustomHeight(value);
      setCustomWidth(newWidth.toString());
    }
  }, [originalAspectRatio, originalDimensions]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      
      let fileToUpload = file;
      
      // Resize image if not using original size
      if (imageSize !== 'original' && originalDimensions) {
        let targetWidth: number;
        let targetHeight: number;
        
        if (imageSize === 'custom') {
          targetWidth = parseInt(customWidth);
          targetHeight = parseInt(customHeight);
        } else {
          const sizeConfig = imageSizes[imageSize];
          const dims = calculateDimensions(
            sizeConfig.maxWidth,
            sizeConfig.maxHeight,
            originalDimensions.width,
            originalDimensions.height
          );
          targetWidth = dims.width;
          targetHeight = dims.height;
        }
        
        // Only resize if dimensions are valid and different from original
        if (!isNaN(targetWidth) && !isNaN(targetHeight) &&
            (targetWidth !== originalDimensions.width || targetHeight !== originalDimensions.height)) {
          fileToUpload = await resizeImage(file, targetWidth, targetHeight);
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('upload_preset', '360blogz');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        onImageUploaded(data.secure_url);
        onClose();
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Upload Image
                </h3>
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  {selectedFile && originalDimensions && (
                    <>
                      <div className="mt-4">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="max-h-48 mx-auto"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Original size: {originalDimensions.width}x{originalDimensions.height}px
                        </p>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Size
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImageSize('original');
                              setCustomWidth(originalDimensions.width.toString());
                              setCustomHeight(originalDimensions.height.toString());
                            }}
                            className={`px-3 py-2 rounded text-sm ${
                              imageSize === 'original'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Original Size
                            <br />
                            <span className="text-xs">
                              ({originalDimensions.width}x{originalDimensions.height}px)
                            </span>
                          </button>
                          {Object.entries(imageSizes).map(([size, info]) => {
                            const dims = calculateDimensions(
                              info.maxWidth,
                              info.maxHeight,
                              originalDimensions.width,
                              originalDimensions.height
                            );
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  setImageSize(size as 'small' | 'medium' | 'large');
                                  setCustomWidth(dims.width.toString());
                                  setCustomHeight(dims.height.toString());
                                }}
                                className={`px-3 py-2 rounded text-sm ${
                                  imageSize === size
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {info.label}
                                <br />
                                <span className="text-xs">
                                  ({dims.width}x{dims.height}px)
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageSize('custom')}
                          className={`w-full px-3 py-2 rounded text-sm ${
                            imageSize === 'custom'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Custom Size
                        </button>
                        {imageSize === 'custom' && (
                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Width (px)</label>
                              <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => updateDimension('width', e.target.value)}
                                placeholder="Width"
                                min="1"
                                max={originalDimensions.width}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Height (px)</label>
                              <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => updateDimension('height', e.target.value)}
                                placeholder="Height"
                                min="1"
                                max={originalDimensions.height}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </div>
                            {originalAspectRatio && (
                              <p className="text-sm text-gray-500">
                                Original aspect ratio: {originalAspectRatio.toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={() => selectedFile && handleUpload(selectedFile)}
              disabled={uploading || !selectedFile}
              className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
} 