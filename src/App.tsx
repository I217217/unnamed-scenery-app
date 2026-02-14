import MapView from './components/Map/MapView';

function App() {
  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapView />

      {/* Global overlay for grain or cinematic vignette can go here */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.6) 100%)', // Vignette
        zIndex: 10
      }} />
    </div>
  )
}

export default App
