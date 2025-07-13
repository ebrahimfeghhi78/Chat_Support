import React, {useState, useRef, useEffect} from 'react';
import {Button, ProgressBar, Alert, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Paperclip, X, Upload, FileText, Image, Music, Film, File, Archive, Sheet, FileType2, FileX} from 'lucide-react';
import {chatApi, fileHelpers, MessageType} from '../../services/chatApi';
import './Chat.css';

const FileUploadComponent = ({onFileUploaded, disabled = false, chatRoomId, maxFileSizeMB = 20}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const uploadRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadRef.current && !uploadRef.current.contains(event.target)) {
        if (!isUploading) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isUploading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    try {
      // Validate file
      fileHelpers.validateFile(file, maxFileSizeMB);

      setSelectedFile(file);

      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } catch (err) {
      setError(err.message);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !chatRoomId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Determine message type
      const messageType = fileHelpers.getMessageTypeFromFile(selectedFile);

      // Upload file with progress tracking
      const result = await chatApi.uploadFile(
        selectedFile, 
        chatRoomId, 
        messageType, 
        (progress) => setUploadProgress(progress));

      // Send file message
      await onFileUploaded({
        url: result.fileUrl,
        name: selectedFile.name,
        size: selectedFile.size,
        type: messageType,
        mimeType: selectedFile.type,
      });

      // Reset state
      resetUpload();
      setIsOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data || error.message || 'خطا در آپلود فایل');
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-12 h-12" />;

    const iconType = fileHelpers.getFileIcon(selectedFile.name, selectedFile.type);
    const iconClass = 'w-12 h-12';

    switch (iconType) {
      case 'image':
        return <Image className={iconClass} />;
      case 'video':
        return <Film className={iconClass} />;
      case 'audio':
        return <Music className={iconClass} />;
      case 'pdf':
        return <FileType2 className={iconClass} />;
      case 'word':
        return <FileText className={iconClass} />;
      case 'excel':
        return <Sheet className={iconClass} />;
      case 'archive':
        return <Archive className={iconClass} />;
      default:
        return <File className={iconClass} />;
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    if (previewUrl) {
      if (selectedFile.type.startsWith('image/')) {
        return (
          <div className="preview-wrapper">
            <img src={previewUrl} alt="Preview" className="preview-media" />
          </div>
        );
      } else if (selectedFile.type.startsWith('video/')) {
        return (
          <div className="preview-wrapper">
            <video src={previewUrl} className="preview-media" controls />
          </div>
        );
      }
    }

    return <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">{getFileIcon()}</div>;
  };

  return (
    <>
      <OverlayTrigger placement="top" overlay={<Tooltip>پیوست فایل</Tooltip>}>
        <Button variant="link" onClick={() => setIsOpen(true)} disabled={disabled} className="p-2 text-gray-500 hover:text-gray-700">
          <Paperclip size={20} />
        </Button>
      </OverlayTrigger>

      {isOpen && (
        <div className="file-upload-modal">
          <div ref={uploadRef} className="file-upload-container">
            <div className="file-upload-header">
              <h5 className="mb-0">ارسال فایل</h5>
              <Button variant="link" onClick={() => !isUploading && setIsOpen(false)} className="p-0 text-gray-500" disabled={isUploading}>
                <X size={20} />
              </Button>
            </div>

            {error && (
              <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="d-none" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" disabled={isUploading} />

            {!selectedFile ? (
              <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={48} className="text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">برای انتخاب فایل کلیک کنید</p>
                <p className="text-sm text-gray-500">حداکثر حجم: {maxFileSizeMB} مگابایت</p>
              </div>
            ) : (
              <div className="file-preview">
                {renderPreview()}

                <div className="file-info mt-3">
                  <p className="font-medium text-truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{fileHelpers.formatFileSize(selectedFile.size)}</p>
                </div>

                {isUploading && (
                  <div className="mt-3">
                    <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} animated striped />
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  {!isUploading && (
                    <>
                      <Button variant="secondary" onClick={resetUpload} className="flex-fill">
                        تغییر فایل
                      </Button>
                      <Button variant="primary" onClick={uploadFile} className="flex-fill">
                        <Upload size={16} className="me-2" />
                        ارسال
                      </Button>
                    </>
                  )}
                  {isUploading && (
                    <Button variant="danger" onClick={resetUpload} className="flex-fill">
                      لغو
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .file-upload-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 1rem;
        }

        .file-upload-container {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .file-upload-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .file-drop-zone {
          padding: 3rem 2rem;
          border: 2px dashed #e5e7eb;
          border-radius: 0.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin: 1rem;
        }

        .file-drop-zone:hover {
          border-color: #3b82f6;
          background: #f9fafb;
        }

        .file-preview {
          padding: 1rem;
        }

        .preview-wrapper {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .preview-media {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .file-info {
          border-top: 1px solid #e5e7eb;
          padding-top: 0.75rem;
        }

        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          color: #fff !important;
        }

        .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
          color: #fff !important;
          opacity: 0.7;
        }

        @media (max-width: 480px) {
          .file-upload-container {
            max-width: 100%;
            margin: 0 0.5rem;
          }
          .preview-wrapper {
            height: 140px;
          }
        }
      `}</style>
    </>
  );
};

export default FileUploadComponent;
