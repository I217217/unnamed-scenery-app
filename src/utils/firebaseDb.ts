import { db, storage } from '../lib/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    onSnapshot, query, orderBy, Timestamp, getDocs
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import type { Spot } from '../data/spots';

const COLLECTION_NAME = 'spots';

// Convert Firestore data to Spot interface
const convertToSpot = (doc: any): Spot => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        // Convert Timestamp to ISO string if needed, or keep as is if Spot supports it
        // For simplicity, we assume Spot uses strings for IDs.
        // If 'createdAt' exists: createdAt: data.createdAt?.toDate().toISOString() 
    } as Spot;
};

// Real-time remote subscription
export const subscribeToSpots = (onUpdate: (spots: Spot[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

    // This returns an unsubscribe function
    return onSnapshot(q, (snapshot) => {
        const spots = snapshot.docs.map(convertToSpot);
        onUpdate(spots);
    });
};

// 1. Upload File (Image/Audio)
export const uploadFileToStorage = async (fileDataUrl: string, path: string): Promise<string> => {
    // Check if it's already a remote URL
    if (fileDataUrl.startsWith('http')) return fileDataUrl;

    const storageRef = ref(storage, path);
    await uploadString(storageRef, fileDataUrl, 'data_url');
    return getDownloadURL(storageRef);
};

// Also support raw File object for drag-and-drop
export const uploadRawFileToStorage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};


// 2. Save Spot (Create or Update)
export const saveSpotToFirebase = async (spot: Spot, imageFile?: File | string, audioFile?: File | string) => {
    try {
        let imageUrl = spot.imageUrl;
        let audioUrl = spot.audioUrl;

        // Ensure we have an ID for the folder structure even if it's new
        // Ideally, we let Firestore generate ID, but to keep folder strict, we might want a UUID.
        // Let's use the spot.id if valid, or a timestamp-based ID for NEW spots.
        const docId = spot.id && spot.id.length > 10 ? spot.id : doc(collection(db, COLLECTION_NAME)).id;

        // Upload Image
        if (imageFile) {
            const path = `spots/${docId}/image_${Date.now()}`;
            if (typeof imageFile === 'string') {
                if (imageFile.startsWith('data:')) imageUrl = await uploadFileToStorage(imageFile, path);
            } else {
                imageUrl = await uploadRawFileToStorage(imageFile, path);
            }
        }

        // Upload Audio
        if (audioFile) {
            const path = `spots/${docId}/audio_${Date.now()}`;
            if (typeof audioFile === 'string') {
                if (audioFile.startsWith('data:')) audioUrl = await uploadFileToStorage(audioFile, path);
            } else {
                audioUrl = await uploadRawFileToStorage(audioFile, path);
            }
        }

        const spotData = {
            ...spot,
            id: docId,
            imageUrl: imageUrl || null,
            audioUrl: audioUrl || null,
            location: spot.location || null, // Ensure no undefined
            updatedAt: Timestamp.now()
        };

        // If new (based on check), add 'createdAt'
        // But since we might be overwriting, let's use setDoc via doc() ref to be safe with custom IDs
        // or just use update/add. 
        // Simplest: use setDoc (merge) if we have ID, or addDoc if not.

        // Actually, let's check if it exists or just use setDoc with merge.
        const docRef = doc(db, COLLECTION_NAME, docId);

        // We can't easily check existence without reading, but setDoc with merge is safe.
        // However, for "createdAt", we only want it on creation.
        // Let's just include it in data if it's missing from input spot object?

        await import('firebase/firestore').then(({ setDoc }) => {
            setDoc(docRef, {
                ...spotData,
                createdAt: spotData.createdAt || Timestamp.now()
            }, { merge: true });
        });

        return docId;

    } catch (e) {
        console.error("Error saving to Firebase", e);
        throw e;
    }
};

// 3. Delete Spot
export const deleteSpotFromFirebase = async (spotId: string) => {
    await deleteDoc(doc(db, COLLECTION_NAME, spotId));
    // Ideally delete storage files too, but simpler to skip for now (or implement later)
    // To delete files, we'd need to know their paths or list the folder.
};
