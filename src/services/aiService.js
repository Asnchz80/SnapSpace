import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Gemini client ──────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn('[SnapSpace] VITE_GEMINI_API_KEY is not set — AI redesign will use demo data.')
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

// ── Helpers ────────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

function buildSearchUrl(store, productName) {
  const q = encodeURIComponent(productName)
  const map = {
    'IKEA':           `https://www.ikea.com/us/en/search/?q=${q}`,
    'Wayfair':        `https://www.wayfair.com/keyword.php?keyword=${q}`,
    'West Elm':       `https://www.westelm.com/search/results.html?words=${q}`,
    'Amazon':         `https://www.amazon.com/s?k=${q}`,
    'CB2':            `https://www.cb2.com/search?query=${q}`,
    'Pottery Barn':   `https://www.potterybarn.com/search/results.html?words=${q}`,
    'Target':         `https://www.target.com/s?searchTerm=${q}`,
    'Crate & Barrel': `https://www.crateandbarrel.com/search?query=${q}`,
  }
  return map[store] ?? `https://www.google.com/search?q=${q}+furniture+buy`
}

// ── Prompt schema ──────────────────────────────────────────────
const ANALYSIS_PROMPT = (style, extra = '') => `
You are a professional interior designer AI.
Analyze the uploaded photo of a room or kitchen and redesign it in ${style} style.

Rules:
- Keep the same room structure, walls, windows, doors, and floor plan.
- Make the redesign realistic — no fantasy or impossible architecture.
- Recommend 4-6 specific purchasable products (furniture, lighting, textiles, decor, storage).
- Products must be from: IKEA, Wayfair, West Elm, Amazon, CB2, Pottery Barn, Target, or Crate & Barrel.
${extra}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "imagePrompt": "extremely detailed photorealistic prompt for generating the redesigned room image — describe every element, lighting, materials, colors, and style precisely",
  "description": "1-2 sentence plain-English summary of the redesign",
  "products": [
    {
      "name": "exact product name",
      "category": "Furniture|Lighting|Textiles|Decor|Storage|Appliances",
      "priceRange": "$XX–$XX",
      "store": "store name from the allowed list",
      "reason": "one sentence on why this fits the redesign"
    }
  ]
}
`.trim()

// ── Generate image via Gemini 2.0 Flash image generation ───────
async function generateImage(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  })

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const parts = result.response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
    }
  }
  throw new Error('Gemini returned no image data. Check your API key and quota.')
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Redesign the full space.
 * Returns { redesignedImageUrl, description, products }
 */
export async function redesignSpace(imageFile, style = 'Modern') {
  if (!genAI) throw new Error('VITE_GEMINI_API_KEY is not configured.')

  const base64   = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  // Step 1 — Vision analysis: understand the room and build a generation prompt
  const analysisModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const analysisResult = await analysisModel.generateContent([
    { inlineData: { data: base64, mimeType } },
    { text: ANALYSIS_PROMPT(style) },
  ])

  const raw    = analysisResult.response.text().trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  const parsed = JSON.parse(raw)
  const { imagePrompt, description, products = [] } = parsed

  // Step 2 — Generate the redesigned image
  const finalPrompt = `Photorealistic interior design photograph. ${imagePrompt}. Same room dimensions, walls, windows, and doors as the original. Professional real estate photography lighting. No text or watermarks.`
  const redesignedImageUrl = await generateImage(finalPrompt)

  return {
    redesignedImageUrl,
    description,
    products: products.map((p) => ({ ...p, searchUrl: buildSearchUrl(p.store, p.name) })),
  }
}

/**
 * Redesign a specific painted area.
 * maskDataUrl is a canvas PNG with violet paint over the area to change.
 * Returns { redesignedImageUrl, description, products }
 */
export async function redesignArea(originalImageFile, maskDataUrl, instruction, style = 'Modern') {
  if (!genAI) throw new Error('VITE_GEMINI_API_KEY is not configured.')

  const base64   = await fileToBase64(originalImageFile)
  const mimeType = originalImageFile.type || 'image/jpeg'

  const extra = instruction
    ? `- The user painted over a specific area and wants: "${instruction}". Change ONLY that area; keep the rest identical.`
    : '- The user painted over a specific area. Redesign that area to match the overall style; keep the rest identical.'

  // Step 1 — Analyze original image + area instruction
  const analysisModel  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const analysisResult = await analysisModel.generateContent([
    { inlineData: { data: base64, mimeType } },
    { text: ANALYSIS_PROMPT(style, extra) },
  ])

  const raw    = analysisResult.response.text().trim()
    .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  const parsed = JSON.parse(raw)
  const { imagePrompt, description, products = [] } = parsed

  // Step 2 — Generate updated image
  const finalPrompt = `Photorealistic interior design photograph. ${imagePrompt}. Keep the unchanged areas of the room identical to the original. Professional lighting. No text or watermarks.`
  const redesignedImageUrl = await generateImage(finalPrompt)

  return {
    redesignedImageUrl,
    description,
    products: products.map((p) => ({ ...p, searchUrl: buildSearchUrl(p.store, p.name) })),
  }
}
