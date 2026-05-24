/* eslint-disable max-len */
'use strict'

const { onCall, HttpsError }  = require('firebase-functions/v2/https')
const { defineSecret }        = require('firebase-functions/params')
const { initializeApp }       = require('firebase-admin/app')
const { GoogleGenerativeAI }  = require('@google/generative-ai')

initializeApp()

const geminiApiKey = defineSecret('GEMINI_API_KEY')

// ── Helpers ────────────────────────────────────────────────────
const buildSearchUrl = (store, productName) => {
  const q   = encodeURIComponent(productName)
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

function validateBase64(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0)
    throw new HttpsError('invalid-argument', `${fieldName} must be a non-empty string.`)
  if (value.length > 20_000_000)
    throw new HttpsError('invalid-argument', `${fieldName} exceeds the 15 MB limit.`)
}

const ANALYSIS_PROMPT = (style, extra = '') => `
You are a professional interior designer AI.
Analyze the uploaded photo of a room or kitchen and redesign it in ${style} style.

Rules:
- Keep the same room structure, walls, windows, doors, and floor plan.
- Make the redesign realistic — no fantasy or impossible architecture.
- Recommend 4-6 specific purchasable products.
- Products must be from: IKEA, Wayfair, West Elm, Amazon, CB2, Pottery Barn, Target, or Crate & Barrel.
${extra}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "imagePrompt": "extremely detailed photorealistic prompt for generating the redesigned room image",
  "description": "1-2 sentence plain-English summary of the redesign",
  "products": [
    {
      "name": "exact product name",
      "category": "Furniture|Lighting|Textiles|Decor|Storage|Appliances",
      "priceRange": "$XX-$XX",
      "store": "store name",
      "reason": "one sentence on why this fits"
    }
  ]
}
`.trim()

async function generateImage(genAI, prompt) {
  const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' })
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  })

  const parts = result.response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
    }
  }
  throw new HttpsError('internal', 'Gemini returned no image data.')
}

// ─────────────────────────────────────────────────────────────────
// redesignSpace — full room redesign
// ─────────────────────────────────────────────────────────────────
exports.redesignSpace = onCall(
  { secrets: [geminiApiKey], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const { imageBase64, style = 'Modern' } = request.data ?? {}
    validateBase64(imageBase64, 'imageBase64')

    const genAI = new GoogleGenerativeAI(geminiApiKey.value())

    // Step 1: Vision analysis
    const analysisModel  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const analysisResult = await analysisModel.generateContent([
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
      { text: ANALYSIS_PROMPT(style) },
    ])

    let parsed
    try {
      const raw = analysisResult.response.text().trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new HttpsError('internal', 'Failed to parse Gemini analysis response.')
    }

    const { imagePrompt, description, products = [] } = parsed

    // Step 2: Generate redesigned image
    const finalPrompt = `Photorealistic interior design photograph. ${imagePrompt}. Same room dimensions, walls, windows, and doors. Professional real estate photography lighting. No text or watermarks.`
    const redesignedImageUrl = await generateImage(genAI, finalPrompt)

    return {
      redesignedImageUrl,
      description,
      products: products.map((p) => ({ ...p, searchUrl: buildSearchUrl(p.store, p.name) })),
    }
  },
)

// ─────────────────────────────────────────────────────────────────
// redesignArea — repaint a masked sub-region
// ─────────────────────────────────────────────────────────────────
exports.redesignArea = onCall(
  { secrets: [geminiApiKey], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const { imageBase64, instruction = '', style = 'Modern' } = request.data ?? {}
    validateBase64(imageBase64, 'imageBase64')

    const genAI = new GoogleGenerativeAI(geminiApiKey.value())

    const extra = instruction
      ? `- The user selected a specific area and wants: "${instruction}". Change ONLY that area; keep the rest identical.`
      : '- The user selected a specific area. Redesign that area to match the overall style; keep the rest identical.'

    const analysisModel  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const analysisResult = await analysisModel.generateContent([
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
      { text: ANALYSIS_PROMPT(style, extra) },
    ])

    let parsed
    try {
      const raw = analysisResult.response.text().trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new HttpsError('internal', 'Failed to parse Gemini analysis response.')
    }

    const { imagePrompt, description, products = [] } = parsed

    const finalPrompt = `Photorealistic interior design photograph. ${imagePrompt}. Keep the unchanged areas identical to the original. Professional lighting. No text or watermarks.`
    const redesignedImageUrl = await generateImage(genAI, finalPrompt)

    return {
      redesignedImageUrl,
      description,
      products: products.map((p) => ({ ...p, searchUrl: buildSearchUrl(p.store, p.name) })),
    }
  },
)

// ── Helper: build OpenAI client ───────────────────────────────
const buildClient = () => new OpenAI({ apiKey: openaiApiKey.value() })

// ── Helper: build retailer search URL ────────────────────────
function buildSearchUrl(store, productName) {
  const q = encodeURIComponent(productName)
  const map = {
    'IKEA':         `https://www.ikea.com/us/en/search/?q=${q}`,
    'Wayfair':      `https://www.wayfair.com/keyword.php?keyword=${q}`,
    'West Elm':     `https://www.westelm.com/search/results.html?words=${q}`,
    'Amazon':       `https://www.amazon.com/s?k=${q}`,
    'CB2':          `https://www.cb2.com/search?query=${q}`,
    'Pottery Barn': `https://www.potterybarn.com/search/results.html?words=${q}`,
    'Target':       `https://www.target.com/s?searchTerm=${q}`,
    'Crate & Barrel': `https://www.crateandbarrel.com/search?query=${q}`,
  }
  return map[store] ?? `https://www.google.com/search?q=${q}+${encodeURIComponent(store)}+buy`
}

// ── Helper: validate base64 payload ──────────────────────────
function validateBase64(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpsError('invalid-argument', `${fieldName} must be a non-empty string.`)
  }
  if (value.length > 20_000_000) { // ~15 MB raw = ~20 MB base64
    throw new HttpsError('invalid-argument', `${fieldName} exceeds the 15 MB image size limit.`)
  }
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional interior designer AI. 
When given a photo of a room or kitchen, you:
1. Analyze the existing space (dimensions, lighting, architectural features).
2. Redesign it in the requested style — realistically, keeping the same room structure, walls, windows, and doors.
3. Return a DALL-E 3 prompt that will produce a photorealistic redesigned version of the same space.
4. Recommend 4–6 specific purchasable products used in the redesign (furniture, lighting, textiles, decor).

RULES:
- Keep redesigns realistic — no impossible rooms or fantasy architecture.
- Products must be available at major retailers (IKEA, Wayfair, West Elm, Amazon, CB2, Pottery Barn, Target, Crate & Barrel).
- Prices must be realistic market ranges.
- Return ONLY valid JSON — no markdown code blocks, no extra text.`

const PRODUCT_SCHEMA = `{
  "dallePrompt": "string — detailed DALL-E 3 prompt for the redesigned photo",
  "description": "string — 1-2 sentence plain-English description of the redesign",
  "products": [
    {
      "name": "exact product name",
      "category": "Furniture | Lighting | Textiles | Decor | Storage | Appliances",
      "priceRange": "$XX – $XX",
      "store": "IKEA | Wayfair | West Elm | Amazon | CB2 | Pottery Barn | Target | Crate & Barrel",
      "reason": "one sentence on why this product fits the redesign"
    }
  ]
}`

// ─────────────────────────────────────────────────────────────────
// redesignSpace — full room redesign
// ─────────────────────────────────────────────────────────────────
exports.redesignSpace = onCall(
  { secrets: [openaiApiKey], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const { imageBase64, style = 'Modern' } = request.data ?? {}
    validateBase64(imageBase64, 'imageBase64')

    const openai = buildClient()

    // Step 1: GPT-4o — analyze space and generate redesign plan + DALL-E prompt
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `Redesign this space in a ${style} style. Return JSON matching exactly this schema:\n${PRODUCT_SCHEMA}`,
            },
          ],
        },
      ],
    })

    let parsed
    try {
      const raw = analysisResponse.choices[0].message.content.trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new HttpsError('internal', 'Failed to parse AI analysis response.')
    }

    const { dallePrompt, description, products = [] } = parsed

    // Step 2: DALL-E 3 — generate the redesigned image
    let imageUrl
    try {
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${dallePrompt}\n\nIMPORTANT: Photorealistic interior photograph. Keep the exact same room layout, walls, windows, and doors as the original. Do NOT add fantasy elements. Professional real estate photography quality.`,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        response_format: 'url',
      })
      imageUrl = imageResponse.data[0].url
    } catch (e) {
      throw new HttpsError('internal', `DALL-E generation failed: ${e.message}`)
    }

    // Step 3: Enrich products with constructed search URLs
    const enrichedProducts = products.map((p) => ({
      ...p,
      searchUrl: buildSearchUrl(p.store, p.name),
    }))

    return {
      redesignedImageUrl: imageUrl,
      description,
      products: enrichedProducts,
    }
  },
)

// ─────────────────────────────────────────────────────────────────
// redesignArea — repaint a masked sub-region of the image
// ─────────────────────────────────────────────────────────────────
exports.redesignArea = onCall(
  { secrets: [openaiApiKey], timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const { imageBase64, maskBase64, instruction = '', style = 'Modern' } = request.data ?? {}
    validateBase64(imageBase64, 'imageBase64')
    validateBase64(maskBase64,  'maskBase64')

    const openai = buildClient()

    // Step 1: GPT-4o — build a targeted DALL-E prompt for the masked area
    const areaAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 900,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `The user has painted a mask over a specific area of this room.
${instruction ? `User instruction: "${instruction}"` : ''}
Style: ${style}.

Produce a DALL-E 3 prompt that redesigns ONLY the masked area in the requested style, while keeping everything else identical.
Return JSON: { "dallePrompt": "...", "description": "...", "products": [<same product schema>] }`,
            },
          ],
        },
      ],
    })

    let parsed
    try {
      const raw = areaAnalysis.choices[0].message.content.trim()
        .replace(/^```json\s*/i, '').replace(/```\s*$/, '')
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new HttpsError('internal', 'Failed to parse area analysis response.')
    }

    const { dallePrompt, description, products = [] } = parsed

    // Step 2: DALL-E 2 edit — inpainting with mask
    // Decode base64 to Buffers for the API
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const maskBuffer  = Buffer.from(maskBase64,  'base64')

    let imageUrl
    try {
      // DALL-E 2 edit requires square RGBA PNG images
      // We pass buffers directly using OpenAI's File-like object
      const { toFile } = require('openai')

      const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' })
      const maskFile  = await toFile(maskBuffer,  'mask.png',  { type: 'image/png' })

      const editResponse = await openai.images.edit({
        model: 'dall-e-2',
        image: imageFile,
        mask:  maskFile,
        prompt: `${dallePrompt}. Photorealistic, ${style} interior design style. Blend seamlessly with the surrounding unchanged areas.`,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      })
      imageUrl = editResponse.data[0].url
    } catch (editErr) {
      // Fallback: if edit fails, generate a full new image with DALL-E 3
      console.warn('DALL-E 2 edit failed, falling back to DALL-E 3:', editErr.message)
      try {
        const fallback = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `${dallePrompt}\n\nPhotorealistic ${style} interior. Professional photography quality.`,
          n: 1,
          size: '1792x1024',
          quality: 'hd',
          response_format: 'url',
        })
        imageUrl = fallback.data[0].url
      } catch (fallbackErr) {
        throw new HttpsError('internal', `Image generation failed: ${fallbackErr.message}`)
      }
    }

    const enrichedProducts = products.map((p) => ({
      ...p,
      searchUrl: buildSearchUrl(p.store, p.name),
    }))

    return {
      redesignedImageUrl: imageUrl,
      description,
      products: enrichedProducts,
    }
  },
)
