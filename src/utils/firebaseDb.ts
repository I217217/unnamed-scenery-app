import { db, storage } from '../lib/firebase';
import {
    collection, deleteDoc, doc,
    onSnapshot, query, orderBy, Timestamp, setDoc
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import type { Spot } from '../data/spots';

const COLLECTION_NAME = 'spots';

// Convert Firestore data to Spot interface
const convertToSpot = (doc: any): Spot => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
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
        const originalId = spot.id;
        const isNew = !originalId || originalId.length < 10;
        const docId = isNew ? doc(collection(db, COLLECTION_NAME)).id : originalId;

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

        const docRef = doc(db, COLLECTION_NAME, docId);

        const payload: any = { ...spotData };
        // Only set createdAt if NEW (or if we explicitly want to overwrite, but safer not to)
        // If updating, createdAt is preserved by merge: true if not included
        if (isNew) {
            payload.createdAt = Timestamp.now();
        }

        await setDoc(docRef, payload, { merge: true });

        return docId;

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
