import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Spot } from '../../data/spots';
import { reverseGeocode } from '../../utils/geocoding';

interface AddSpotFormProps {
    lat: number;
    lng: number;
    initialData?: Spot; // Optional for editing
    onSave: (spot: Spot, imageFile?: File | string, audioFile?: File | string) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => void;
}

const AddSpotForm = ({ lat, lng, initialData, onSave, onCancel, onDelete }: AddSpotFormProps) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [story, setStory] = useState(initialData?.story || '');
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    const [audioUrl, setAudioUrl] = useState(initialData?.audioUrl || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Auto-fetch location for new spots
    useEffect(() => {
        if (!initialData && !location) {
            reverseGeocode(lat, lng).then(loc => {
                if (loc) setLocation(loc);
            });
        }
    }, [lat, lng, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const newSpot: Spot = {
            id: initialData?.id || '', // ID will be handled by Firebase if empty, or reused if editing
            lat,
            lng,
            title,
            location,
            description: '', // Removed field
            story,
            imageUrl: imageUrl || 'https://images.unsplash.com/photo-1485637701894-09ad422f6de6?q=80&w=2596&auto=format&fit=crop', // Fallback moody image
            audioUrl: audioUrl || undefined
        };

        try {
            await onSave(newSpot, imageFile || imageUrl, audioFile || audioUrl);
        } catch (error) {
            console.error("Save failed", error);
            alert("保存に失敗しました。");
            setIsSubmitting(false);
        }
    };


    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingAudio, setIsDraggingAudio] = useState(false);

    const handleAudioFile = (file: File) => {
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setAudioUrl(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImageUrl(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onCancel : undefined} // Close when clicking backdrop
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 30,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <motion.form
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking form
                className="no-scrollbar"
                style={{
                    background: 'rgba(20, 20, 25, 0.9)',
                    padding: '2rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    width: '90%',
                    maxWidth: '500px',
                    maxHeight: '90vh', // Limit height
                    overflowY: 'auto', // Enable scrolling
                    color: '#e0e0e0',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    position: 'relative'
                }}
            >
                {isSubmitting && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.7)',
                        zIndex: 10,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column'
                    }}>
                        <div className="spinner" style={{
                            width: '30px',
                            height: '30px',
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Uploading...</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                <h2 className="serif" style={{ marginTop: 0, textAlign: 'center', fontWeight: 'normal' }}>
                    {initialData ? '記憶を書き直す' : '記憶を刻む'}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginBottom: '1.5rem' }}>
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>タイトル</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            borderRadius: '2px',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>場所 (国・都市)</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="例：Tokyo, Japan"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            borderRadius: '2px',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>物語 (Story)</label>
                    <textarea
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        required
                        rows={5}
                        disabled={isSubmitting}
                        className="no-scrollbar"
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            borderRadius: '2px',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'var(--font-serif)'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>画像 (クリック アップロード または ドロップ)</label>

                    <div
                        onDragOver={(e) => { e.preventDefault(); if (!isSubmitting) setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (!isSubmitting) handleFile(e.dataTransfer.files[0]);
                        }}
                        onClick={() => !isSubmitting && fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            border: `2px dashed ${isDragging ? '#a29bfe' : 'rgba(255,255,255,0.2)'}`,
                            borderRadius: '4px',
                            backgroundColor: isDragging ? 'rgba(162, 155, 254, 0.1)' : 'rgba(255,255,255,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '1rem',
                            transition: 'all 0.3s',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            marginBottom: '0.5rem',
                            opacity: isSubmitting ? 0.6 : 1
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFile(e.target.files[0]);
                                }
                            }}
                            disabled={isSubmitting}
                        />

                        {imageUrl ? (
                            <div style={{ position: 'relative', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) {
                                            setImageUrl('');
                                            setImageFile(null);
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: -10,
                                        right: -10,
                                        background: '#333',
                                        color: '#fff',
                                        border: '1px solid #555',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                                ここをクリックして画像を選択<br />
                                <span style={{ fontSize: '0.7rem' }}>またはドラッグ＆ドロップ</span>
                            </div>
                        )}
                    </div>

                    {/* Always visible Input */}
                    <input
                        type="url"
                        value={imageUrl.startsWith('data:') ? '(画像ファイルを選択中)' : imageUrl}
                        onChange={(e) => {
                            if (!e.target.value.startsWith('(')) {
                                setImageUrl(e.target.value);
                            }
                        }}
                        disabled={imageUrl.startsWith('data:') || isSubmitting}
                        placeholder="または画像URL..."
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: imageUrl.startsWith('data:') ? '#888' : '#fff',
                            borderRadius: '2px',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>音楽 (クリック アップロード または ドロップ)</label>

                    <div
                        onDragOver={(e) => { e.preventDefault(); if (!isSubmitting) setIsDraggingAudio(true); }}
                        onDragLeave={() => setIsDraggingAudio(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingAudio(false);
                            if (!isSubmitting) handleAudioFile(e.dataTransfer.files[0]);
                        }}
                        onClick={() => !isSubmitting && audioInputRef.current?.click()}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            border: `2px dashed ${isDraggingAudio ? '#a29bfe' : 'rgba(255,255,255,0.2)'}`,
                            borderRadius: '4px',
                            backgroundColor: isDraggingAudio ? 'rgba(162, 155, 254, 0.1)' : 'rgba(255,255,255,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '1rem',
                            transition: 'all 0.3s',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            marginBottom: '0.5rem',
                            opacity: isSubmitting ? 0.6 : 1
                        }}
                    >
                        <input
                            type="file"
                            ref={audioInputRef}
                            style={{ display: 'none' }}
                            accept="audio/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleAudioFile(e.target.files[0]);
                                }
                            }}
                            disabled={isSubmitting}
                        />

                        {audioUrl && audioUrl.startsWith('data:') ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <audio controls src={audioUrl} style={{ width: '100%', height: '30px', marginBottom: '0.5rem' }} />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) {
                                            setAudioUrl('');
                                            setAudioFile(null);
                                        }
                                    }}
                                    style={{
                                        background: '#333',
                                        color: '#fff',
                                        border: '1px solid #555',
                                        borderRadius: '4px',
                                        padding: '2px 8px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    削除
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                                ここをクリックして音楽を選択<br />
                                <span style={{ fontSize: '0.7rem' }}>またはドラッグ＆ドロップ</span>
                            </div>
                        )}
                    </div>

                    {/* Always visible Input */}
                    <input
                        type="url"
                        value={audioUrl.startsWith('data:') ? '(音楽ファイルを選択中)' : audioUrl}
                        onChange={(e) => {
                            if (!e.target.value.startsWith('(')) {
                                setAudioUrl(e.target.value);
                            }
                        }}
                        disabled={audioUrl.startsWith('data:') || isSubmitting}
                        placeholder="または音楽URL (mp3, YouTube, Spotify)..."
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: audioUrl.startsWith('data:') ? '#888' : '#fff',
                            borderRadius: '2px',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {initialData && onDelete && (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('このスポットを削除しますか？')) {
                                    onDelete();
                                }
                            }}
                            disabled={isSubmitting}
                            style={{
                                marginRight: 'auto', // Push to left
                                padding: '0.8rem 1rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#ff6b6b',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                borderRadius: '2px',
                                opacity: isSubmitting ? 0.5 : 0.8
                            }}
                        >
                            削除する
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#ccc',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            opacity: isSubmitting ? 0.5 : 1
                        }}
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: '#a29bfe',
                            border: 'none',
                            color: '#000',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            opacity: isSubmitting ? 0.5 : 1
                        }}
                    >
                        {isSubmitting ? '保存中...' : '記憶を残す'}
                    </button>
                </div>

            </motion.form>
        </motion.div>
    );
};

export default AddSpotForm;
