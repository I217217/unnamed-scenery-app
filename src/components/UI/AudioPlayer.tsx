import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

// Simple ambient loop for exploration
const AMBIENT_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3'; // Placeholder rain

interface AudioPlayerProps {
    currentTrackUrl?: string; // If present, fade out ambient and play this
}

const AudioPlayer = ({ currentTrackUrl }: AudioPlayerProps) => {
    const ambientRef = useRef<Howl | null>(null);

    // Master Volume State (0.0 to 1.0)
    const [volume, setVolume] = useState(0.5);
    const [isHoveringVolume, setIsHoveringVolume] = useState(false);

    // Track State for Fading
    const [activeUrl, setActiveUrl] = useState<string | undefined>(currentTrackUrl);
    const fadeMultiplier = useRef(0); // 0.0 to 1.0, used for fade in/out transitions
    const fadeIntervalRef = useRef<number | undefined>(undefined);

    // Audio Element Ref for local files
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Iframe Ref for YouTube
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // Spotify Check
    const isSpotify = activeUrl?.includes('spotify.com');

    // Helper to extract YouTube ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = activeUrl ? getYoutubeId(activeUrl) : null;
    const isYoutube = !!youtubeId;

    useEffect(() => {
        // Initialize Ambient Sound
        ambientRef.current = new Howl({
            src: [AMBIENT_URL],
            loop: true,
            volume: 0,
            html5: true
        });

        ambientRef.current.play();
        // Initial fade in to idle level (0.3 * volume)
        ambientRef.current.fade(0, 0.3 * volume, 2000);

        return () => {
            ambientRef.current?.unload();
        };
    }, []);

    // Apply Volume Changes (Master Volume + Fade Multiplier)
    const applyVolume = () => {
        const effectiveVolume = volume * fadeMultiplier.current;

        // Local Audio
        if (audioRef.current) {
            audioRef.current.volume = effectiveVolume * 0.8; // scaling a bit down for balance
        }

        // YouTube Audio
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [effectiveVolume * 100]
            }), '*');
        }
    };

    // Handle Master Volume Changes
    useEffect(() => {
        // Apply to Ambient
        if (ambientRef.current) {
            const targetBase = activeUrl ? 0.05 : 0.3; // Ducking if track active
            ambientRef.current.volume(targetBase * volume);
        }
        // Apply to Track (re-trigger calculation)
        applyVolume();
    }, [volume, activeUrl]); // Re-run when url state changes (ducking) or volume changes

    // Handle Track Switching & Fading Logic
    useEffect(() => {
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = undefined;
        }

        if (currentTrackUrl) {
            // New Track or Same Track
            if (currentTrackUrl !== activeUrl) {
                // Switching tracks
                setActiveUrl(currentTrackUrl);
                fadeMultiplier.current = 0; // Reset for fade-in
            }

            // Fade In Logic
            fadeIntervalRef.current = window.setInterval(() => {
                fadeMultiplier.current += 0.05;
                if (fadeMultiplier.current >= 1) {
                    fadeMultiplier.current = 1;
                    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                }
                applyVolume();
            }, 100);

            // Audio Element handling (needs to play if explicitly switched)
            if (audioRef.current && !activeUrl?.includes('youtube')) {
                audioRef.current.play().catch(e => console.error("Local play error", e));
            }

            // Ambient Ducking
            const currentAmbient = ambientRef.current?.volume() || 0;
            ambientRef.current?.fade(currentAmbient, 0.05 * volume, 1000);

        } else {
            // Close / Fade Out Logic
            if (activeUrl) {
                // Determine Fade Out
                fadeIntervalRef.current = window.setInterval(() => {
                    fadeMultiplier.current -= 0.05;
                    if (fadeMultiplier.current <= 0) {
                        fadeMultiplier.current = 0;
                        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                        setActiveUrl(undefined); // Remove player after fade
                    }
                    applyVolume();
                }, 100);

                // Restore Ambient
                const currentAmbient = ambientRef.current?.volume() || 0;
                ambientRef.current?.fade(currentAmbient, 0.3 * volume, 2000);
            }
        }

        return () => {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        };
    }, [currentTrackUrl]);

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
            >
                {/* Volume Slider - Visible on hover or always? Let's keep it visible for "bar" request */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{
                        width: isHoveringVolume ? '100px' : '30px', /* Expand on hover */
                        opacity: isHoveringVolume ? 1 : 0.5,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        accentColor: '#fff',
                        height: '2px',
                        appearance: 'auto' // Browsers usually style range inputs okay-ish, or we custom style
                    }}
                />

                <div
                    style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        cursor: 'default',
                        userSelect: 'none'
                    }}
                >
                    VOL {Math.round(volume * 100)}%
                </div>
            </div>

            {/* Hidden Player Container */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1px',
                height: '1px',
                opacity: 0.01,
                pointerEvents: 'none',
                zIndex: 9999,
                overflow: 'hidden'
            }}>
                {/* YouTube Iframe */}
                {isYoutube && (
                    <iframe
                        ref={iframeRef}
                        onLoad={() => {
                            // Sync volume when iframe loads
                            applyVolume();
                        }}
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${youtubeId}&modestbranding=1&playsinline=1`}
                        title="YouTube audio player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}

                {/* Local / Standard Audio Element */}
                {activeUrl && !isYoutube && !isSpotify && (
                    <audio
                        ref={audioRef}
                        src={activeUrl}
                        loop
                        playsInline
                        controls={false}
                        autoPlay
                    />
                )}
            </div>
        </>
    );
};

export default AudioPlayer;
