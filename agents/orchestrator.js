/**
 * AI Agent Orchestrator v2.0
 * Routes orders to service-specific agents + runs color/typo/layout/mood in parallel
 */

const colorAgent = require('./colorAgent');
const typographyAgent = require('./typographyAgent');
const layoutAgent = require('./layoutAgent');
const moodAgent = require('./moodAgent');
const {
  BrandIdentityAgent,
  SocialMediaAgent,
  PrintMarketingAgent,
  ProductPackagingAgent,
  WebsiteGraphicsAgent,
  EventPromotionAgent,
  extractKeywords
} = require('./serviceAgents');

const BASE_AGENTS = [
  { id: 'color', name: 'Color Agent', instance: colorAgent },
  { id: 'typography', name: 'Typography Agent', instance: typographyAgent },
  { id: 'layout', name: 'Layout Agent', instance: layoutAgent },
  { id: 'mood', name: 'Mood Agent', instance: moodAgent }
];

const SERVICE_AGENTS = {
  brand_identity: new BrandIdentityAgent(),
  social_media: new SocialMediaAgent(),
  print_marketing: new PrintMarketingAgent(),
  product_packaging: new ProductPackagingAgent(),
  website_graphics: new WebsiteGraphicsAgent(),
  event_promotion: new EventPromotionAgent()
};

class Orchestrator {
  constructor() {
    this.openai = null;
    this.cache = new Map();
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  _hashBrief(brief, service = 'general') {
    let h = 0;
    const str = brief + service;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h.toString();
  }

  async generate(brief, options = {}) {
    const { orderId, service = 'general', onLog } = options;
    const logs = [];

    const log = async (message, type = 'info') => {
      const entry = { message, type, time: Date.now() };
      logs.push(entry);
      if (onLog) await onLog(entry);
    };

    await log('Initializing YH AI Concept Engine v2.0...', 'system');
    await log(`Order ID: ${orderId}`, 'info');
    await log(`Service: ${service}`, 'info');
    await log(`Brief: "${brief.substring(0, 100)}${brief.length > 100 ? '...' : ''}"`, 'info');

    // Cache check
    const briefHash = this._hashBrief(brief, service);
    if (this.cache.has(briefHash)) {
      await log('Cache hit — returning pre-generated concepts', 'success');
      return this.cache.get(briefHash);
    }

    // Phase 1: Parse brief
    await log('Parsing client brief...', 'prompt');
    const keywords = extractKeywords(brief);
    await log(`Keywords: ${keywords.join(', ')}`, 'success');

    // Phase 2: Run base agents in PARALLEL
    await log('Running base analysis agents in parallel...', 'prompt');
    const basePromises = BASE_AGENTS.map(async agent => {
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

    const baseResultsArray = await Promise.all(basePromises);
    const baseResults = {};
    baseResultsArray.forEach(({ id, result }) => { baseResults[id] = result; });

    // Phase 3: Run service-specific agent
    const serviceAgent = SERVICE_AGENTS[service] || SERVICE_AGENTS.brand_identity;
    await log(`Running ${serviceAgent.name}...`, 'prompt');
    let serviceConcept;
    try {
      serviceConcept = await serviceAgent.analyze(brief, keywords, baseResults, { log });
      await log(`${serviceAgent.name}: Concept generated`, 'success');
    } catch (err) {
      await log(`${serviceAgent.name}: Fallback used — ${err.message}`, 'error');
      serviceConcept = serviceAgent.generateConcept(brief, keywords, baseResults);
    }

    // Phase 4: Generate 2 alternate concepts (variations)
    await log('Generating alternate directions...', 'prompt');
    const altConcepts = this.generateAlternatives(service, brief, keywords, baseResults);

    const concepts = [
      { id: 'concept-1', ...serviceConcept, generatedAt: new Date().toISOString() },
      { id: 'concept-2', ...altConcepts[0], generatedAt: new Date().toISOString() },
      { id: 'concept-3', ...altConcepts[1], generatedAt: new Date().toISOString() }
    ];

    await log(`Generation complete. ${concepts.length} concepts ready.`, 'success');

    const result = {
      concepts,
      analysis: {
        keywords,
        baseResults,
        service,
        generatedAt: new Date().toISOString()
      }
    };

    this.cache.set(briefHash, result);
    if (this.cache.size > 100) this.cache.delete(this.cache.keys().next().value);

    return result;
  }

  generateAlternatives(service, brief, keywords, baseResults) {
    const palette = baseResults.color?.palettes || this.getDefaultPalettes();
    const typePairs = baseResults.typography?.pairs || this.getDefaultTypePairs();
    const layouts = baseResults.layout?.layouts || this.getDefaultLayouts();
    const moods = baseResults.mood?.moods || this.getDefaultMoods();

    const variations = [];
    const titles = this.getAltTitles(service);

    for (let i = 0; i < 2; i++) {
      const p = palette[(i + 1) % palette.length];
      const t = typePairs[(i + 1) % typePairs.length];
      const l = layouts[(i + 1) % layouts.length];
      const m = moods[(i + 1) % moods.length];

      variations.push({
        title: titles[i] || `Direction ${i + 2}`,
        description: `An alternative ${m.name.toLowerCase()} approach using ${p.name} palette. ${m.description} with ${l.description.toLowerCase()}.`,
        tags: [...new Set([...keywords.slice(0, 3), m.tag])].filter(Boolean),
        palette: p.colors,
        typography: { primary: t.primary, secondary: t.secondary },
        layout: { type: l.type, description: l.description },
        mood: { name: m.name, description: m.description },
        deliverables: ['Source Files (AI, PSD, Figma)', 'Export Package (PNG, JPG, SVG)', 'Style Guide Summary'],
        template: {
          gradient: `linear-gradient(${135 + i * 45}deg, ${p.colors[0]} 0%, ${p.colors[2]} 100%)`,
          primaryColor: p.colors[0],
          accentColor: p.colors[2]
        }
      });
    }

    return variations;
  }

  getAltTitles(service) {
    const map = {
      brand_identity: ['Minimal Monoline', 'Geometric Symbol'],
      social_media: ['Story-first Grid', 'Type-driven Feed'],
      print_marketing: ['Editorial Brochure', 'Poster Series'],
      product_packaging: ['Eco Minimal', 'Premium Foil'],
      website_graphics: ['Dark Mode UI', 'Illustration-led'],
      event_promotion: ['Neon Night', 'Classic Gala'],
      general: ['Modern Minimal', 'Bold Expression']
    };
    return map[service] || map.general;
  }

  getDefaultPalettes() {
    return [
      { name: 'Classical Gold', colors: ['#1a1714', '#f5f0e8', '#b8954a', '#5a5548'] },
      { name: 'Deep Luxury', colors: ['#0f0f0f', '#c9a227', '#e8e0d4', '#3a3530'] },
      { name: 'Soft Modern', colors: ['#faf6f0', '#ede8df', '#b8a88a', '#1a1714'] },
      { name: 'Forest Calm', colors: ['#2d3b2d', '#f0f4f0', '#7a9e7e', '#c4d4c4'] }
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
}

module.exports = new Orchestrator();
