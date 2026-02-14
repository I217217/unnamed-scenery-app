import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCtaBQhjwCL5Hw49_E82GrVH3P6AraLATI",
  authDomain: "unnamed-scenery.firebaseapp.com",
  projectId: "unnamed-scenery",
  storageBucket: "unnamed-scenery.firebasestorage.app",
  messagingSenderId: "655013565395",
  appId: "1:655013565395:web:06abfce49b58e41d1f5526",
  measurementId: "G-0D82868H9M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
