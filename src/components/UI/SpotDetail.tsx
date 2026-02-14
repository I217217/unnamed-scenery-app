import { motion } from 'framer-motion';
import type { Spot } from '../../data/spots';

interface SpotDetailProps {
    spot: Spot;
    onClose: () => void;
    onEdit: () => void;
}

const SpotDetail = ({ spot, onClose, onEdit }: SpotDetailProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 20, // Above vignettes
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(5px)',
                backgroundColor: 'rgba(0,0,0,0.4)'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{
                    maxWidth: '1100px', // Increased by ~20%
                    width: '90%',
                    color: '#fff',
                    textAlign: 'center',
                    position: 'relative' // For layout context
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Edit Button */}
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    whileHover={{
                        textShadow: "0 0 8px rgba(255,255,255,0.8)",
                        boxShadow: "0 0 15px rgba(255,255,255,0.2)",
                        borderColor: "rgba(255,255,255,0.8)",
                        color: "rgba(255,255,255,1)"
                    }}
                    style={{
                        position: 'absolute',
                        top: '-3rem', // Move above the image
                        right: 0,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        transition: 'all 0.3s ease'
                    }}
                >
                    編集する
                </motion.button>

                <img
                    src={spot.imageUrl}
                    alt={spot.title}
                    style={{
                        width: 'auto',
                        maxWidth: '100%',
                        height: '450px', // Fixed height
                        objectFit: 'contain', // Ensure full image is visible
                        borderRadius: '2px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        marginBottom: '2rem'
                    }}
                />

                <h2 className="serif" style={{
                    fontSize: '2rem',
                    fontWeight: 'normal',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.1em'
                }}>
                    {spot.title}
                </h2>
                {spot.location && (
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: 0,
                        marginBottom: '1.5rem',
                        letterSpacing: '0.05em',
                        fontFamily: 'var(--font-sans, sans-serif)',
                        textTransform: 'uppercase'
                    }}>
                        {spot.location}
                    </p>
                )}

                {/* External Player Embed (Spotify Only) */}
                {(() => {
                    const url = spot.audioUrl;
                    if (!url) return null;

                    if (url.includes('spotify.com')) {
                        // Convert to embed format
                        // from: https://open.spotify.com/track/ID
                        // to: https://open.spotify.com/embed/track/ID
                        const embedUrl = url.replace('open.spotify.com', 'open.spotify.com/embed');
                        return (
                            <div style={{ marginBottom: '2rem', width: '100%' }}>
                                <iframe
                                    src={embedUrl}
                                    width="100%"
                                    height="80"
                                    frameBorder="0"
                                    allow="encrypted-media; clipboard-write; picture-in-picture"
                                    allowFullScreen
                                    style={{ borderRadius: '4px' }}
                                ></iframe>
                            </div>
                        );
                    }
                    return null;
                })()}

                <p className="serif" style={{
                    fontSize: '1rem',
                    lineHeight: '2',
                    whiteSpace: 'pre-line',
                    opacity: 0.9
                }}>
                    {spot.story}
                </p>

            </motion.div>
        </motion.div>
    );
};

export default SpotDetail;
