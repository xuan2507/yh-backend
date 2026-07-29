/**
 * AI Agent Orchestrator
 * Coordinates Color, Typography, Layout, and Mood agents
 * to generate complete design concepts from client briefs.
 */

const colorAgent = require('./colorAgent');
const typographyAgent = require('./typographyAgent');
const layoutAgent = require('./layoutAgent');
const moodAgent = require('./moodAgent');

const AGENTS = [
  { id: 'color', name: 'Color Agent', instance: colorAgent },
  { id: 'typography', name: 'Typography Agent', instance: typographyAgent },
  { id: 'layout', name: 'Layout Agent', instance: layoutAgent },
  { id: 'mood', name: 'Mood Agent', instance: moodAgent }
];

class Orchestrator {
  constructor() {
    this.openai = null;
    this.cache = new Map();
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  _hashBrief(brief) {
    // Simple hash for caching
    let h = 0;
    for (let i = 0; i < brief.length; i++) {
      h = ((h << 5) - h) + brief.charCodeAt(i);
      h |= 0;
    }
    return h.toString();
  }

  async generate(brief, options = {}) {
    const { orderId, onLog } = options;
    const logs = [];

    const log = async (message, type = 'info') => {
      const entry = { message, type, time: Date.now() };
      logs.push(entry);
      if (onLog) await onLog(entry);
    };

    await log('Initializing YH AI Concept Engine v2.0...', 'system');
    await log(`Order ID: ${orderId}`, 'info');
    await log(`Brief received: "${brief.substring(0, 100)}${brief.length > 100 ? '...' : ''}"`, 'info');

    // Check cache
    const briefHash = this._hashBrief(brief);
    if (this.cache.has(briefHash)) {
      await log('Cache hit — returning pre-generated concepts', 'success');
      return this.cache.get(briefHash);
    }

    // Phase 1: Parse & understand brief
    await log('Parsing client brief...', 'prompt');
    const keywords = this.extractKeywords(brief);
    await log(`Detected keywords: ${keywords.join(', ')}`, 'success');

    // Phase 2: Run agents in PARALLEL for speed
    await log('Running AI agents in parallel...', 'prompt');
    const agentPromises = AGENTS.map(async agent => {
      try {
        const result = await agent.instance.analyze(brief, keywords, {}, { 
          openai: this.openai,
          log: async (msg) => log(msg, 'info')
        });
        await log(`${agent.name}: Analysis complete`, 'success');
        return { id: agent.id, result };
      } catch (err) {
        await log(`${agent.name}: Using fallback`, 'info');
        return { id: agent.id, result: agent.instance.getFallback(brief, keywords) };
      }
    });

    const agentResultsArray = await Promise.all(agentPromises);
    const agentResults = {};
    agentResultsArray.forEach(({ id, result }) => { agentResults[id] = result; });

    // Phase 3: Synthesize concepts
    await log('Synthesizing final concepts...', 'prompt');
    const concepts = await this.synthesizeConcepts(brief, keywords, agentResults, log);
    await log('Generation complete.', 'success');

    const result = {
      concepts,
      analysis: {
        keywords,
        agentResults,
        generatedAt: new Date().toISOString()
      }
    };

    // Cache result
    this.cache.set(briefHash, result);
    if (this.cache.size > 50) this.cache.delete(this.cache.keys().next().value);

    return result;
  }

  extractKeywords(brief) {
    const text = brief.toLowerCase();
    const keywordMap = {
      // Styles
      'minimal': ['minimal', 'minimalist', 'clean', 'simple', 'flat'],
      'luxury': ['luxury', 'luxurious', 'premium', 'high-end', 'elegant', 'sophisticated'],
      'modern': ['modern', 'contemporary', 'current', 'fresh'],
      'vintage': ['vintage', 'retro', 'classic', 'old', 'antique'],
      'bold': ['bold', 'strong', 'powerful', 'impactful', 'loud'],
      'soft': ['soft', 'gentle', 'delicate', 'feminine', 'pastel'],
      // Industries
      'fashion': ['fashion', 'clothing', 'apparel', 'style', 'wear'],
      'food': ['food', 'restaurant', 'cafe', 'coffee', 'culinary', 'dining'],
      'tech': ['tech', 'technology', 'software', 'app', 'digital', 'startup'],
      'health': ['health', 'wellness', 'skincare', 'beauty', 'spa', 'fitness'],
      'finance': ['finance', 'financial', 'bank', 'investment', 'money', 'crypto'],
      // Colors
      'gold': ['gold', 'golden', 'yellow', 'amber'],
      'blue': ['blue', 'navy', 'azure', 'cobalt'],
      'green': ['green', 'emerald', 'sage', 'forest'],
      'black': ['black', 'dark', 'noir'],
      'white': ['white', 'light', 'bright', 'clean'],
      'red': ['red', 'crimson', 'ruby', 'burgundy'],
      // Audience
      'youth': ['young', 'youth', 'gen z', 'millennial', 'teen'],
      'professional': ['professional', 'business', 'corporate', 'b2b'],
      'luxury_audience': ['affluent', 'wealthy', 'discerning', 'upscale']
    };

    const found = [];
    for (const [category, terms] of Object.entries(keywordMap)) {
      if (terms.some(t => text.includes(t))) found.push(category);
    }

    // Always add some defaults
    if (found.length === 0) found.push('modern');
    return [...new Set(found)];
  }

  async synthesizeConcepts(brief, keywords, agentResults, log) {
    const concepts = [];

    // If OpenAI is available, use it for richer generation
    if (this.openai) {
      try {
        await log('Consulting OpenAI for concept enrichment...', 'info');
        const enriched = await this.enrichWithOpenAI(brief, keywords, agentResults);
        if (enriched && enriched.length > 0) {
          return enriched;
        }
      } catch (err) {
        await log(`OpenAI enrichment failed: ${err.message}`, 'error');
      }
    }

    // Fallback: template-based generation
    await log('Using template-based generation...', 'info');

    const palettes = agentResults.color?.palettes || this.getDefaultPalettes();
    const typePairs = agentResults.typography?.pairs || this.getDefaultTypePairs();
    const layouts = agentResults.layout?.layouts || this.getDefaultLayouts();
    const moods = agentResults.mood?.moods || this.getDefaultMoods();

    for (let i = 0; i < 3; i++) {
      const palette = palettes[i % palettes.length];
      const typePair = typePairs[i % typePairs.length];
      const layout = layouts[i % layouts.length];
      const mood = moods[i % moods.length];

      concepts.push({
        id: `concept-${i + 1}`,
        title: this.generateTitle(keywords, mood),
        description: this.generateDescription(keywords, mood, palette),
        tags: [...new Set([...keywords.slice(0, 3), mood.tag])].filter(Boolean),
        palette: palette.colors,
        typography: {
          primary: typePair.primary,
          secondary: typePair.secondary
        },
        layout: {
          type: layout.type,
          description: layout.description
        },
        mood: {
          name: mood.name,
          description: mood.description
        },
        template: this.buildTemplate(keywords, palette, layout, i),
        generatedAt: new Date().toISOString()
      });
    }

    return concepts;
  }

  async enrichWithOpenAI(brief, keywords, agentResults) {
    const prompt = `You are a senior brand designer at YH Studio. Based on this client brief, generate 3 distinct brand concept directions.

CLIENT BRIEF: "${brief}"
DETECTED KEYWORDS: ${keywords.join(', ')}

For each concept, provide:
1. A catchy title (2-4 words)
2. A 2-sentence description of the visual direction
3. 4 hex colors in the palette
4. Primary and secondary font pairing
5. Layout approach
6. Mood/atmosphere keywords
7. 3-4 design tags

Respond in valid JSON format as an array of objects with these exact keys: title, description, palette (array of 4 hex strings), typography (object with primary and secondary), layout (object with type and description), mood (object with name and description), tags (array of strings).

Make each concept genuinely different from the others. Be creative but practical.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a world-class brand designer. Respond only with valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((c, i) => ({
        id: `concept-${i + 1}`,
        ...c,
        template: this.buildTemplateFromAI(c),
        generatedAt: new Date().toISOString()
      }));
    }
    return null;
  }

  generateTitle(keywords, mood) {
    const prefixMap = {
      minimal: 'Clean', luxury: 'Luxe', modern: 'Neo', vintage: 'Heritage',
      bold: 'Bold', soft: 'Soft', fashion: 'Couture', food: 'Culinary',
      tech: 'Digital', health: 'Pure', finance: 'Prime'
    };
    const suffixMap = {
      minimal: 'Minimal', luxury: 'Gold', modern: 'Wave', vintage: 'Archive',
      bold: 'Impact', soft: 'Breeze', fashion: 'Line', food: 'Table',
      tech: 'Code', health: 'Glow', finance: 'Vault'
    };
    const prefix = prefixMap[keywords[0]] || 'Modern';
    const suffix = suffixMap[keywords[1]] || mood.name;
    return `${prefix} ${suffix}`;
  }

  generateDescription(keywords, mood, palette) {
    return `${mood.description} Featuring a palette anchored by ${palette.colors[0]}, this direction emphasizes ${keywords[0]} aesthetics with ${keywords[1] || 'contemporary'} sensibilities.`;
  }

  buildTemplate(keywords, palette, layout, index) {
    const gradients = [
      `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 100%)`,
      `linear-gradient(160deg, ${palette.colors[2]} 0%, ${palette.colors[0]} 50%, ${palette.colors[3]} 100%)`,
      `radial-gradient(ellipse at top, ${palette.colors[1]} 0%, ${palette.colors[0]} 60%)`
    ];
    return {
      gradient: gradients[index % gradients.length],
      layout: layout.type,
      primaryColor: palette.colors[0],
      accentColor: palette.colors[2]
    };
  }

  buildTemplateFromAI(concept) {
    const c = concept.palette;
    return {
      gradient: `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 50%, ${c[2]} 100%)`,
      layout: concept.layout?.type || 'modern',
      primaryColor: c[0],
      accentColor: c[2]
    };
  }

  getDefaultPalettes() {
    return [
      { name: 'Classical Gold', colors: ['#1a1714', '#f5f0e8', '#b8954a', '#5a5548'] },
      { name: 'Deep Luxury', colors: ['#0f0f0f', '#c9a227', '#e8e0d4', '#3a3530'] },
      { name: 'Soft Modern', colors: ['#faf6f0', '#ede8df', '#b8a88a', '#1a1714'] }
    ];
  }

  getDefaultTypePairs() {
    return [
      { primary: 'Cormorant Garamond', secondary: 'Inter' },
      { primary: 'Playfair Display', secondary: 'DM Sans' },
      { primary: 'Bodoni Moda', secondary: 'Space Grotesk' }
    ];
  }

  getDefaultLayouts() {
    return [
      { type: 'asymmetric', description: 'Asymmetric grid with generous whitespace' },
      { type: 'modular', description: 'Modular card-based system' },
      { type: 'editorial', description: 'Editorial-style long-form layout' }
    ];
  }

  getDefaultMoods() {
    return [
      { name: 'Refined', description: 'Polished and sophisticated with subtle elegance', tag: 'elegant' },
      { name: 'Bold', description: 'High contrast and confident visual statements', tag: 'bold' },
      { name: 'Serene', description: 'Calm and balanced with breathing room', tag: 'calm' }
    ];
  }
}

module.exports = new Orchestrator();
