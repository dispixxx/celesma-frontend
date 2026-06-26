import { useEffect, useRef, useState } from 'react';
import type { AttachmentResponse } from '../../types';
import api from '../../api/client';


interface Props {
    projectId: number;
    canUpload: boolean;
    currentUsername: string | null;
    isOwner: boolean;
}

function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
    return 'insert_drive_file';
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

export default function ProjectAttachments({ projectId, canUpload, currentUsername, isOwner }: Props) {
    const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [collapsed, setCollapsed] = useState(false);

    const load = () => {
        api.get(`/projects/${projectId}/attachments`)
            .then(r => setAttachments(r.data))
            .catch(() => { });
    };

    useEffect(() => { load(); }, [projectId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/projects/${projectId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCollapsed(false);
            load();
        } catch (e: any) {
            const data = e.response?.data;
            setError(typeof data === 'string' ? data : data?.message || 'Ошибка загрузки');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (url: string, fileName: string, mimeType: string) => {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const blob = mimeType === 'text/plain'
            ? new Blob([new TextDecoder('utf-8').decode(buffer)], { type: 'text/plain;charset=utf-8' })
            : new Blob([buffer], { type: mimeType });

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(blobUrl);
    };

    const handleDelete = async (attachmentId: number) => {
        if (!confirm('Удалить файл?')) return;
        try {
            await api.delete(`/projects/${projectId}/attachments/${attachmentId}`);
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        } catch {
            setError('Ошибка удаления');
        }
    };

    return (
        <section className="attachments-section">
            <div className="attachments-header">
                <button
                    className="attachments-collapse-btn"
                    onClick={() => setCollapsed(prev => !prev)}
                    title={collapsed ? 'Развернуть' : 'Свернуть'}
                >
                    <h2 className="section-title" style={{ color: 'var(--text)', margin: 0 }}>
                        Файлы
                    </h2>
                    <span className="material-icons" style={{
                        fontSize: '20px',
                        color: 'var(--text-secondary)',
                        transition: 'transform 0.2s',
                        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                    }}>
                        expand_more
                    </span>
                </button>

                {canUpload && (
                    <label className="attachments-upload-btn" title="Прикрепить файл">
                        {uploading
                            ? <span className="material-icons spinning">sync</span>
                            : <span className="material-icons">attach_file</span>
                        }
                        <span>{uploading ? 'Загрузка...' : 'Прикрепить'}</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>

            {!collapsed && (
                <>
                    {error && (
                        <p className="attachments-error">
                            <span className="material-icons">error_outline</span>
                            {error}
                        </p>
                    )}

                    {attachments.length === 0 ? (
                        <p className="attachments-empty">Нет прикреплённых файлов</p>
                    ) : (
                        <div className="attachments-list">
                            {attachments.map(a => {
                                const isImage = a.mimeType.startsWith('image/');
                                const canDelete = isOwner || a.uploadedBy.username === currentUsername;

                                return (
                                    <div key={a.id} className="attachment-item">
                                        {isImage ? (
                                            <img src={a.fileUrl} alt={a.fileName} className="attachment-thumb" />
                                        ) : (
                                            <div className="attachment-icon">
                                                <span className="material-icons">{getFileIcon(a.mimeType)}</span>
                                            </div>
                                        )}

                                        <div className="attachment-info">
                                            <a
                                                href={a.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="attachment-name"
                                                title={a.fileName}
                                            >
                                                {a.fileName}
                                            </a>
                                            <span className="attachment-meta">
                                                {formatSize(a.fileSize)} · {a.uploadedBy.username}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                            <button
                                                className="attachment-action-btn"
                                                onClick={() => handleDownload(a.fileUrl, a.fileName, a.mimeType)}
                                                title="Скачать"
                                            >
                                                <span className="material-icons">download</span>
                                            </button>

                                            {canDelete && (
                                                <button
                                                    className="attachment-action-btn attachment-action-btn--delete"
                                                    onClick={() => handleDelete(a.id)}
                                                    title="Удалить"
                                                >
                                                    <span className="material-icons">delete_outline</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}