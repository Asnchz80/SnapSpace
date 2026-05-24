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
You are a professional interior designer and architectural photographer AI.
Analyze the uploaded photo of a real room and redesign it in ${style} style.

Rules:
- Keep the EXACT same room geometry: same walls, ceiling height, floor shape, windows, doors, and architectural features. Do NOT change the room structure.
- Replace only furniture, decor, textiles, lighting fixtures, and surface finishes (paint, flooring, etc.).
- The output must look like a REAL PHOTOGRAPH taken with a DSLR camera — hyper-realistic, photographic quality. NOT a 3D render, NOT illustrated, NOT CGI, NOT animated.
- Match the original photo's perspective, camera angle, and field of view exactly.
- Use realistic lighting: natural light from windows plus artificial light matching the style. Realistic shadows, reflections, and material textures.
- Recommend 4-6 specific purchasable products (furniture, lighting, textiles, decor, storage).
- Products must be from: IKEA, Wayfair, West Elm, Amazon, CB2, Pottery Barn, Target, or Crate & Barrel.
${extra}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "imagePrompt": "Hyper-realistic DSLR interior photograph. Same room: [describe the exact walls, windows, floor, ceiling from the photo]. Redesigned in ${style} style: [describe all new furniture, finishes, lighting, colors, and materials in exhaustive detail]. Same camera angle and perspective as the original photo. Photorealistic shadows and reflections. Shot on Canon EOS R5 with 24mm f/2.8 lens. No CGI look, no 3D render, no illustration style.",
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
// Pass originalBase64 + mimeType to use image-to-image (keeps room structure)
async function generateImage(prompt, originalBase64, mimeType) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  })

  const parts = []
  // Include the original photo so the model preserves room geometry
  if (originalBase64 && mimeType) {
    parts.push({ inlineData: { data: originalBase64, mimeType } })
  }
  parts.push({ text: prompt })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const responseParts = result.response.candidates?.[0]?.content?.parts ?? []
  for (const part of responseParts) {
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

  // Step 2 — Generate the redesigned image (image-to-image: original photo + prompt)
  const finalPrompt = [
    'Hyper-realistic interior design photograph taken with a DSLR camera.',
    'This is the SAME room as the reference photo — same walls, same ceiling, same floor plan, same windows, same doors, same camera angle and perspective.',
    'Only replace the furniture, decor, textiles, lighting fixtures, and surface finishes.',
    imagePrompt,
    'Output must look like a REAL PHOTOGRAPH, NOT a 3D render, NOT CGI, NOT illustrated, NOT animated.',
    'Photorealistic materials: accurate wood grain, fabric weave, metal reflections, glass transparency.',
    'Natural window light plus style-appropriate artificial lighting. Realistic shadows and depth.',
    'Professional real estate photography. Shot on Canon EOS R5, 24mm lens, f/5.6. No text, no watermarks.',
  ].join(' ')
  const redesignedImageUrl = await generateImage(finalPrompt, base64, mimeType)

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

  // Step 2 — Generate updated image (image-to-image: original photo + prompt)
  const finalPrompt = [
    'Hyper-realistic interior design photograph taken with a DSLR camera.',
    'This is the SAME room as the reference photo — same walls, ceiling, floor plan, windows, doors, and camera angle.',
    'Redesign ONLY the painted/selected area as described. Keep every other part of the room pixel-identical to the reference photo.',
    imagePrompt,
    'Output must look like a REAL PHOTOGRAPH, NOT a 3D render, NOT CGI, NOT illustrated, NOT animated.',
    'Seamless integration: the redesigned area must blend naturally with the unchanged parts.',
    'Matching lighting and shadows across old and new areas. No text, no watermarks.',
  ].join(' ')
  const redesignedImageUrl = await generateImage(finalPrompt, base64, mimeType)

  return {
    redesignedImageUrl,
    description,
    products: products.map((p) => ({ ...p, searchUrl: buildSearchUrl(p.store, p.name) })),
  }
}
