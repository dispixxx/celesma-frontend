import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/getCroppedImg';

interface Props {
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

export default function AvatarCropModal({ onClose, onSave }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(blob);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal-content avatar-crop-modal">
        <h2>Изменить фото</h2>

        {!imageSrc ? (
          <div className="avatar-upload-zone">
            <label className="avatar-upload-label">
              <span className="material-icons">upload</span>
              <span>Выбрать фото</span>
              <input type="file" accept="image/*" onChange={onFileChange} hidden />
            </label>
          </div>
        ) : (
          <>
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="zoom-control">
              <span className="material-icons" style={{ fontSize: '18px' }}>zoom_in</span>
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                Другое фото
                <input type="file" accept="image/*" onChange={onFileChange} hidden />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={onClose}>Отмена</button>
                <button className="btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Сохраняю...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}