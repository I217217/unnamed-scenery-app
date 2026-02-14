import { motion } from 'framer-motion';
import type { Spot } from '../../data/spots';

interface MemoryPinProps {
    spot: Spot;
    onClick: (spot: Spot) => void;
}

const MemoryPin = ({ spot, onClick }: MemoryPinProps) => {
    return (
        <motion.div
            onClick={(e) => {
                e.stopPropagation(); // Prevent map click
                onClick(spot);
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.8 }} // Significantly larger on hover
            style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px', // Larger Hit Area
                height: '40px', // Larger Hit Area
            }}
        >
            {/* Glow Effect & Circle */}
            <motion.div
                animate={{
                    boxShadow: [
                        '0 0 10px 2px rgba(224, 192, 144, 0.4)', // Amber #e0c090
                        '0 0 20px 8px rgba(224, 192, 144, 0.2)',
                        '0 0 10px 2px rgba(224, 192, 144, 0.4)'
                    ]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    width: '16px', // Slightly larger visible pin
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#e0c090', // Amber
                    pointerEvents: 'none' // Clicks go to parent
                }}
            />

            {/* Label on hover (To be implemented or handled by parent tooltip) */}
        </motion.div>
    );
};

export default MemoryPin;
