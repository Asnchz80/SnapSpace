/**
 * aiImprovementService.js
 *
 * Logs every AI interaction to a dedicated branch in the Firebase Realtime
 * Database (`aiImprovement/{userId}/{scanId}/...`) so the data can be used
 * to improve the AI model over time.
 *
 * What is stored per scan session:
 *   meta/          — description, timestamps, original image URL
 *   styles/        — each of the 5 generated style images + AI description
 *   areaRedos/     — every paint-mask adjustment: instruction + result image
 *   chatThread/    — full conversation (user prompts & AI replies + images)
 *
 * Images for area-redo and chat results (not already in Storage) are uploaded
 * to:  aiImprovement/{userId}/{scanId}/areaRedos/{styleId}_{ts}
 *       aiImprovement/{userId}/{scanId}/chat/{styleId}_{ts}
 *
 * All functions are fire-and-forget safe — they swallow errors internally so
 * they never block or break the main UI flow.
 */

import { ref as dbRef, set, update, push } from 'firebase/database'
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import { rtdb, storage } from '../firebase.js'

// ── Internal helper ───────────────────────────────────────────

/**
 * Upload a base64 data-URL image to Firebase Storage and return its
 * public download URL.  Falls back to the original value on error.
 */
async function uploadAiImage(userId, scanId, folder, name, dataUrl) {
  try {
    const path = `aiImprovement/${userId}/${scanId}/${folder}/${name}`
    const sRef = storageRef(storage, path)
    await uploadString(sRef, dataUrl, 'data_url')
    return await getDownloadURL(sRef)
  } catch (err) {
    console.warn('[AI Improvement] image upload failed:', err)
    return dataUrl   // keep in-memory data URL as fallback
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Called when a new scan session begins.
 * Creates the top-level RTDB node for this scan.
 */
export async function aiLog_ScanStart(userId, scanId, description) {
  try {
    await set(dbRef(rtdb, `aiImprovement/${userId}/${scanId}/meta`), {
      createdAt:        Date.now(),
      description:      description ?? '',
      originalImageUrl: null,
    })
  } catch (err) {
    console.warn('[AI Improvement] aiLog_ScanStart failed:', err)
  }
}

/**
 * Called after the original room photo is uploaded to Storage.
 * Updates the meta node with the publicly accessible URL.
 */
export async function aiLog_OriginalImage(userId, scanId, imageUrl) {
  try {
    await update(dbRef(rtdb, `aiImprovement/${userId}/${scanId}/meta`), {
      originalImageUrl: imageUrl,
    })
  } catch (err) {
    console.warn('[AI Improvement] aiLog_OriginalImage failed:', err)
  }
}

/**
 * Called after each of the 5 initial style generations completes.
 * @param {string} imageUrl  Firebase Storage URL (already uploaded by historyService)
 */
export async function aiLog_StyleResult(userId, scanId, styleId, imageUrl, aiDescription) {
  try {
    await set(dbRef(rtdb, `aiImprovement/${userId}/${scanId}/styles/${styleId}`), {
      imageUrl,
      aiDescription: aiDescription ?? '',
      generatedAt:   Date.now(),
    })
  } catch (err) {
    console.warn('[AI Improvement] aiLog_StyleResult failed:', err)
  }
}

/**
 * Called after a paint-mask / area redo completes.
 * Uploads the result image to Storage and logs the entry.
 *
 * @param {string} instruction  The user's text prompt for what to change
 * @param {string} resultDataUrl  base64 data-URL returned by the AI service
 */
export async function aiLog_AreaRedo(userId, scanId, styleId, instruction, resultDataUrl) {
  try {
    const timestamp = Date.now()
    const resultImageUrl = await uploadAiImage(
      userId, scanId,
      'areaRedos',
      `${styleId}_${timestamp}`,
      resultDataUrl,
    )
    await push(dbRef(rtdb, `aiImprovement/${userId}/${scanId}/areaRedos`), {
      style:          styleId,
      instruction,
      resultImageUrl,
      timestamp,
    })
  } catch (err) {
    console.warn('[AI Improvement] aiLog_AreaRedo failed:', err)
  }
}

/**
 * Called for every chat message (user prompt + AI reply).
 * For assistant messages that include a new image, uploads the image first.
 *
 * @param {string} role        'user' | 'assistant'
 * @param {string} content     Text content of the message
 * @param {string|null} imageDataUrl  Only set for assistant replies with an image
 */
export async function aiLog_ChatMessage(userId, scanId, styleId, role, content, imageDataUrl = null) {
  try {
    const timestamp = Date.now()
    const entry = {
      style: styleId,
      role,
      content,
      timestamp,
      imageUrl: null,
    }

    if (imageDataUrl) {
      entry.imageUrl = await uploadAiImage(
        userId, scanId,
        'chat',
        `${styleId}_${timestamp}`,
        imageDataUrl,
      )
    }

    await push(dbRef(rtdb, `aiImprovement/${userId}/${scanId}/chatThread`), entry)
  } catch (err) {
    console.warn('[AI Improvement] aiLog_ChatMessage failed:', err)
  }
}
