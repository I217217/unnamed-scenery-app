import { useState, useRef } from 'react';
import { type Spot } from '../../data/spots';

interface DataControlsProps {
    spots: Spot[];
    onImport: (spots: Spot[]) => void;
}

const DataControls = ({ spots, onImport }: DataControlsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataStr = JSON.stringify(spots, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `unnamed-scenery-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        if (window.confirm("現在のデータを上書きしてバックアップを復元しますか？この操作は取り消せません。")) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const parsed = JSON.parse(json);
                if (Array.isArray(parsed)) {
                    // Check if it looks like spots (basic validation)
                    const isValid = parsed.every(item => item.id && item.lat && item.lng);
                    if (isValid) {
                        onImport(parsed as Spot[]);
                        alert("復元が完了しました。");
                        setIsOpen(false);
                    } else {
                        alert("データ形式が正しくありません。");
                    }
                } else {
                    alert("JSONファイルが正しくありません。");
                }
            } catch (error) {
                console.error("Import error", error);
                alert("ファイルの読み込みに失敗しました。");
            }
        };
        reader.readAsText(file);

        // Reset input for same file selection
        e.target.value = '';
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '250px', // Left of "Add Spot"(if it was there) or generally top-right
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: 'rgba(20, 20, 20, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ddd',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                {isOpen ? 'Close' : 'Data Backup'}
            </button>

            {isOpen && (
                <div style={{
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    minWidth: '200px'
                }}>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        📤 Download JSON
                    </button>

                    <button
                        onClick={handleImportClick}
                        style={{
                            padding: '10px',
                            backgroundColor: 'rgba(255, 100, 100, 0.2)',
                            border: 'none',
                            color: '#ffaaaa',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        📥 Restore from JSON
                    </button>

                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>
                        バックアップファイルを読み込むと、現在のデータは上書きされます。
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataControls;
