import {
  collection, doc, setDoc, updateDoc, query,
  orderBy, limit, getDocs, deleteDoc,
  serverTimestamp, increment,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'

// ── Internal helpers ──────────────────────────────────────────

async function uploadDataUrl(path, dataUrl) {
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Public API ────────────────────────────────────────────────

/**
 * Create the Firestore scan record immediately (so style saves don't race).
 * The original image upload happens separately via uploadScanOriginal().
 */
export async function initScanRecord(userId, scanId, userDescription) {
  await setDoc(doc(db, 'users', userId, 'scans', scanId), {
    createdAt: serverTimestamp(),
    userDescription: userDescription || '',
    originalUrl: null,
    styles: {},
    completedCount: 0,
  })
}

/**
 * Upload the original room photo to Storage and save its URL on the scan doc.
 */
export async function uploadScanOriginal(userId, scanId, imageFile) {
  const dataUrl = await fileToDataUrl(imageFile)
  const url = await uploadDataUrl(`scans/${userId}/${scanId}/original`, dataUrl)
  await updateDoc(doc(db, 'users', userId, 'scans', scanId), { originalUrl: url })
  return url
}

/**
 * Upload a generated style image to Storage and save the style result to Firestore.
 * Returns the Storage download URL.
 */
export async function saveStyleToScan(userId, scanId, styleId, emoji, result) {
  let imageUrl = result.redesignedImageUrl
  if (imageUrl?.startsWith('data:')) {
    imageUrl = await uploadDataUrl(
      `scans/${userId}/${scanId}/${styleId.toLowerCase()}`,
      imageUrl,
    )
  }

  await updateDoc(doc(db, 'users', userId, 'scans', scanId), {
    [`styles.${styleId}`]: {
      emoji,
      status: 'done',
      imageUrl,
      description: result.description || '',
      products: result.products || [],
      roomType: result.roomType || '',
      estimatedSqFt: result.estimatedSqFt ?? null,
      roomDimensions: result.roomDimensions || '',
      ceilingHeight: result.ceilingHeight || '',
      floorPlanNotes: result.floorPlanNotes || '',
    },
    completedCount: increment(1),
  })

  return imageUrl
}

/**
 * Load the user's most recent scan records (default: last 9).
 */
export async function loadUserScans(userId, count = 9) {
  const q = query(
    collection(db, 'users', userId, 'scans'),
    orderBy('createdAt', 'desc'),
    limit(count),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Delete a scan record from Firestore (Storage images are NOT deleted).
 */
export async function deleteScanRecord(userId, scanId) {
  await deleteDoc(doc(db, 'users', userId, 'scans', scanId))
}
