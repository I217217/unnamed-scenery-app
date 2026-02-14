
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type Spot } from '../../data/spots';
import MemoryPin from './MemoryPin';
import AddSpotForm from '../UI/AddSpotForm';
import SpotDetail from '../UI/SpotDetail';
import AudioPlayer from '../UI/AudioPlayer';
import DataControls from '../UI/DataControls';
import { AnimatePresence } from 'framer-motion';
import { subscribeToSpots, saveSpotToFirebase, deleteSpotFromFirebase } from '../../utils/firebaseDb';

// Token from environment
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapView = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

    const [lng] = useState(139.6917);
    const [lat] = useState(35.6895);
    const [zoom] = useState(12);

    const [allSpots, setAllSpots] = useState<Spot[]>([]);

    // Real-time Firebase Subscription
    useEffect(() => {
        const unsubscribe = subscribeToSpots((updatedSpots) => {
            setAllSpots(updatedSpots);
        });
        return () => unsubscribe();
    }, []);


    const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
    const [newSpotPosition, setNewSpotPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [editingSpot, setEditingSpot] = useState<Spot | null>(null);

    // Refs for Event Listeners to access current state
    const selectedSpotRef = useRef(selectedSpot);
    const newSpotPositionRef = useRef(newSpotPosition);

    useEffect(() => {
        selectedSpotRef.current = selectedSpot;
        newSpotPositionRef.current = newSpotPosition;
    }, [selectedSpot, newSpotPosition]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current) return;

        // Variable to hold the animation frame ID for clouds, accessible for cleanup
        let cloudAnimationFrameId: number | undefined;

        // 1. Initialize Map Instance (Only once)
        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [lng, lat],
                zoom: zoom,
                attributionControl: false,
                logoPosition: 'bottom-right',
                projection: { name: 'globe' }
            });

            // Click to add spot (Only need to bind once)
            map.current.on('click', (e) => {
                // Check if we are currently viewing a spot or adding a spot using refs
                // We need to use refs because this callback is defined once and closes over initial state
                if (selectedSpotRef.current) {
                    setSelectedSpot(null);
                    return; // Stop here, don't open add form
                }

                if (newSpotPositionRef.current) {
                    setNewSpotPosition(null);
                    return;
                }

                // If nothing is open, THEN allow adding a new spot
                setSelectedSpot(null);
                setNewSpotPosition({
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng
                });
            });
        }

        // 2. Define Visuals Update Logic (Can run multiple times for HMR)
        const initVisuals = () => {
            if (!map.current) return;

            // Ensure any previous cloud animation is stopped before starting a new one
            if (cloudAnimationFrameId) {
                cancelAnimationFrame(cloudAnimationFrameId);
                cloudAnimationFrameId = undefined;
            }

            // Fog - ENABLED
            map.current.setFog({
                'color': 'rgb(30, 25, 22)',     // Warm dark brown
                'high-color': 'rgb(50, 40, 35)', // Lighter warm brown
                'horizon-blend': 0.4,
                'space-color': 'rgb(20, 18, 16)', // Deep warm base
                'star-intensity': 0.4
            });

            // --- 3D Drifting Clouds Implementation ---

            // CLEANUP OLD
            if (map.current.getLayer('clouds-layer')) map.current.removeLayer('clouds-layer');
            if (map.current.getSource('clouds')) map.current.removeSource('clouds');

            const getCurrentCenter = () => map.current?.getCenter() || { lng: 139.6, lat: 35.6 };
            const startCenter = getCurrentCenter();

            const cloudCount = 1; // Reduced from 2 to 1 (Absolute minimum)

            type CloudPuff = {
                offsetX: number;
                offsetY: number;
                radiusScale: number;
                opacityScale: number;
            };

            type CloudEntity = {
                id: number;
                lng: number;
                lat: number;
                speed: number;
                baseOpacity: number;
                puffs: CloudPuff[];
            };

            const clouds: CloudEntity[] = Array.from({ length: cloudCount }).map((_, i) => {
                const puffCount = 6 + Math.floor(Math.random() * 4); // Increased to 6-10 for "Mokumoku" shape
                const puffs: CloudPuff[] = Array.from({ length: puffCount }).map(() => ({
                    offsetX: (Math.random() - 0.5) * 0.03, // Tighter cluster
                    offsetY: (Math.random() - 0.5) * 0.02,
                    radiusScale: 0.5 + Math.random() * 0.7, // Varied sizes (small lumps + big smooths)
                    opacityScale: 0.6 + Math.random() * 0.4
                }));

                return {
                    id: i,
                    lng: startCenter.lng + (Math.random() - 0.5) * 0.02,
                    lat: startCenter.lat + (Math.random() - 0.5) * 0.02,
                    speed: 0.00001 + Math.random() * 0.000015,
                    baseOpacity: 0.5, // Start visible
                    puffs: puffs
                };
            });

            // Add Source
            map.current.addSource('clouds', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Add Layer - FINAL + FADE
            map.current.addLayer({
                id: 'clouds-layer',
                type: 'circle',
                source: 'clouds',
                paint: {
                    // Radius: Simple Interpolation (Stable)
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        4, 20,
                        10, 60,
                        15, 150
                    ],
                    'circle-color': '#ffffff',
                    // Opacity: Data Driven (Safe simple getter)
                    'circle-opacity': ['get', 'opacity'],
                    'circle-blur': 0.5,
                    'circle-pitch-alignment': 'viewport'
                }
            });

            // Animation Loop
            const animateClouds = () => {
                if (!map.current || !map.current.getSource('clouds')) {
                    cloudAnimationFrameId = undefined;
                    return;
                }

                const bounds = map.current.getBounds();
                if (!bounds) {
                    cloudAnimationFrameId = requestAnimationFrame(animateClouds);
                    return;
                }

                const center = map.current.getCenter();
                const zoom = map.current.getZoom(); // Get current zoom

                const minLng = bounds.getWest();
                const maxLng = bounds.getEast();

                const lngSpan = maxLng - minLng;
                const latSpan = bounds.getNorth() - bounds.getSouth();

                // Safe Zone
                const safeRatio = 0.7;
                const safeLngDist = lngSpan * safeRatio / 2;
                const safeLatDist = latSpan * safeRatio / 2;

                // Zoom Fade Logic (JS side is safer than Mapbox Expression)
                let zoomFactor = 1;
                if (zoom < 10.5) {
                    zoomFactor = 0;
                } else if (zoom < 12.5) {
                    zoomFactor = (zoom - 10.5) / 2; // Linear fade 10.5->12.5
                }

                const flattenedFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];

                clouds.forEach(cloud => {
                    // Constant Move
                    cloud.lng += cloud.speed;

                    // Fade / Respawn Logic
                    const distLng = Math.abs(cloud.lng - center.lng);
                    const distLat = Math.abs(cloud.lat - center.lat);

                    let targetOpacity = 1;
                    if (distLng > safeLngDist || distLat > safeLatDist) {
                        targetOpacity = 0;
                    }

                    // Smooth Fade
                    const fadeSpeed = targetOpacity > cloud.baseOpacity ? 0.02 : 0.05;
                    cloud.baseOpacity += (targetOpacity - cloud.baseOpacity) * fadeSpeed;

                    // Respawn
                    if (cloud.baseOpacity < 0.01 && targetOpacity === 0) {
                        const respawnRatio = 2.5; // Wide area = often off-screen (0 clouds)
                        cloud.lng = center.lng + (Math.random() - 0.5) * lngSpan * respawnRatio;
                        cloud.lat = center.lat + (Math.random() - 0.5) * latSpan * respawnRatio;

                        cloud.baseOpacity = 0;
                        cloud.speed = 0.00001 + Math.random() * 0.000015;
                    }

                    // Generate Puffs
                    cloud.puffs.forEach((puff, i) => {
                        flattenedFeatures.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [cloud.lng + puff.offsetX, cloud.lat + puff.offsetY]
                            },
                            properties: {
                                id: cloud.id * 100 + i,
                                radiusScale: puff.radiusScale,
                                // Apply Zoom Factor + Halved Opacity
                                opacity: cloud.baseOpacity * puff.opacityScale * zoomFactor * 0.25
                            }
                        });
                    });
                });

                const source = map.current.getSource('clouds') as mapboxgl.GeoJSONSource;
                source.setData({
                    type: 'FeatureCollection',
                    features: flattenedFeatures
                });

                cloudAnimationFrameId = requestAnimationFrame(animateClouds);
            };

            animateClouds();
        };

        // 3. Trigger InitVisuals
        if (map.current) { // Ensure map is initialized before trying to access its methods
            if (map.current.isStyleLoaded()) {
                initVisuals();
            } else {
                // Use .once to ensure the listener is removed after it fires
                map.current.once('style.load', initVisuals);
            }
        }

        // 4. Cleanup on unmount (or re-render)
        return () => {
            if (cloudAnimationFrameId) {
                cancelAnimationFrame(cloudAnimationFrameId);
            }
            // If the map instance exists and the style is not loaded yet,
            // remove the 'style.load' listener to prevent it from firing later.
            if (map.current && !map.current.isStyleLoaded()) {
                map.current.off('style.load', initVisuals);
            }
            // We don't remove the map instance itself here, as it's meant to persist.
            // Cloud layers/sources are cleaned up at the start of initVisuals.
        };

    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

    // Sync Markers with State
    useEffect(() => {
        if (!map.current) return;

        // Simple sync: Clear all and redraw (inefficient for many spots but robust for this scale)
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};

        // Add new markers
        allSpots.forEach(spot => {
            const placeholder = document.createElement('div');
            const root = createRoot(placeholder);

            root.render(
                <MemoryPin
                    spot={spot}
                    onClick={(s) => {
                        setNewSpotPosition(null);
                        setSelectedSpot(s);

                        map.current?.flyTo({
                            center: [s.lng, s.lat],
                            zoom: 15,
                            speed: 0.8,
                            curve: 1,
                            pitch: 60,
                            easing: (t) => t * (2 - t)
                        });
                    }}
                />
            );

            const marker = new mapboxgl.Marker({
                element: placeholder,
                anchor: 'center'
            })
                .setLngLat([spot.lng, spot.lat])
                .addTo(map.current!);

            markersRef.current[spot.id] = marker;
        });
    }, [allSpots]);





    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* Data Backup/Restore Controls (Legacy/Migration) */}
            <DataControls
                spots={allSpots}
                onImport={(importedSpots) => {
                    // Manual Migration Logic: Save imported spots to Firebase one by one
                    if (window.confirm("インポートされたデータをクラウド(Firebase)に保存しますか？")) {
                        importedSpots.forEach(async (spot) => {
                            await saveSpotToFirebase(spot);
                        });
                        alert("バックグラウンドでクラウドへの保存を開始しました。");
                    }
                }}
            />

            {/* Audio Player (Ambient + Spot Music) */}
            <AudioPlayer currentTrackUrl={selectedSpot?.audioUrl} />

            {/* Spot Detail Overlay */}
            <AnimatePresence>
                {selectedSpot && !newSpotPosition && (
                    <SpotDetail
                        key="spot-detail"
                        spot={selectedSpot}
                        onClose={() => {
                            setSelectedSpot(null);
                            map.current?.easeTo({ pitch: 0, zoom: 13, duration: 1500 });
                        }}
                        onEdit={() => {
                            setEditingSpot(selectedSpot);
                            setSelectedSpot(null); // Close detail
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Add/Edit Spot Form Overlay */}
            <AnimatePresence>
                {(newSpotPosition || editingSpot) && (
                    <AddSpotForm
                        key="add-spot-form"
                        lat={editingSpot ? editingSpot.lat : newSpotPosition!.lat}
                        lng={editingSpot ? editingSpot.lng : newSpotPosition!.lng}
                        initialData={editingSpot || undefined}
                        onCancel={() => {
                            setNewSpotPosition(null);
                            setEditingSpot(null);
                        }}
                        onDelete={() => {
                            if (editingSpot) {
                                deleteSpotFromFirebase(editingSpot.id);
                                setEditingSpot(null);
                                setSelectedSpot(null);
                            }
                        }}
                        onSave={async (savedSpot, imageFile, audioFile) => {
                            await saveSpotToFirebase(savedSpot, imageFile, audioFile);
                            // State updates are handled by the subscription
                            setNewSpotPosition(null);
                            setEditingSpot(null);

                            // Optionally fly to spot
                            map.current?.flyTo({
                                center: [savedSpot.lng, savedSpot.lat],
                                zoom: 14
                            });
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Wander Mode Button */}
            <div
                onClick={() => {
                    if (allSpots.length === 0) return;
                    // Pick random spot different from current if possible
                    let available = allSpots;
                    if (selectedSpot && allSpots.length > 1) {
                        available = allSpots.filter(s => s.id !== selectedSpot.id);
                    }
                    const randomSpot = available[Math.floor(Math.random() * available.length)];

                    setSelectedSpot(randomSpot);
                    map.current?.flyTo({
                        center: [randomSpot.lng, randomSpot.lat],
                        zoom: 15,
                        pitch: 60,
                        speed: 0.5, // Slow, cinematic fly
                        curve: 1.2
                    });
                }}
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#e0e0e0',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '0.1em',
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(4px)',
                    transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
                WANDER
            </div>


        </div>
    );
};

export default MapView;
