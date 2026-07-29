/**
 * Service-Specific AI Agents
 * One agent per frontend service
 */

const colorAgent = require('./colorAgent');
const typographyAgent = require('./typographyAgent');
const layoutAgent = require('./layoutAgent');
const moodAgent = require('./moodAgent');

// Helper: extract keywords
function extractKeywords(brief) {
  const text = brief.toLowerCase();
  const keywordMap = {
    minimal: ['minimal', 'minimalist', 'clean', 'simple', 'flat'],
    luxury: ['luxury', 'luxurious', 'premium', 'high-end', 'elegant', 'sophisticated'],
    modern: ['modern', 'contemporary', 'current', 'fresh'],
    vintage: ['vintage', 'retro', 'classic', 'old', 'antique'],
    bold: ['bold', 'strong', 'powerful', 'impactful', 'loud'],
    soft: ['soft', 'gentle', 'delicate', 'feminine', 'pastel'],
    fashion: ['fashion', 'clothing', 'apparel', 'style', 'wear'],
    food: ['food', 'restaurant', 'cafe', 'coffee', 'culinary', 'dining'],
    tech: ['tech', 'technology', 'software', 'app', 'digital', 'startup'],
    health: ['health', 'wellness', 'skincare', 'beauty', 'spa', 'fitness'],
    finance: ['finance', 'financial', 'bank', 'investment', 'money', 'crypto'],
    gold: ['gold', 'golden', 'yellow', 'amber'],
    blue: ['blue', 'navy', 'azure', 'cobalt'],
    green: ['green', 'emerald', 'sage', 'forest'],
    black: ['black', 'dark', 'noir'],
    white: ['white', 'light', 'bright', 'clean'],
    red: ['red', 'crimson', 'ruby', 'burgundy'],
    youth: ['young', 'youth', 'gen z', 'millennial', 'teen'],
    professional: ['professional', 'business', 'corporate', 'b2b'],
    luxury_audience: ['affluent', 'wealthy', 'discerning', 'upscale']
  };
  const found = [];
  for (const [category, terms] of Object.entries(keywordMap)) {
    if (terms.some(t => text.includes(t))) found.push(category);
  }
  if (found.length === 0) found.push('modern');
  return [...new Set(found)];
}

// Base agent class
class ServiceAgent {
  constructor(name, serviceType) {
    this.name = name;
    this.serviceType = serviceType;
  }

  async analyze(brief, keywords, agentResults, options = {}) {
    const { log } = options;
    if (log) await log(`${this.name} analyzing brief...`);
    return this.generateConcept(brief, keywords, agentResults);
  }

  generateConcept(brief, keywords, agentResults) {
    throw new Error('Must implement generateConcept');
  }

  getPalette(keywords, agentResults) {
    return agentResults.color?.palettes?.[0] || {
      name: 'Default',
      colors: ['#1a1714', '#f5f0e8', '#b8954a', '#5a5548']
    };
  }

  getTypePair(agentResults) {
    return agentResults.typography?.pairs?.[0] || {
      primary: 'Cormorant Garamond',
      secondary: 'Inter'
    };
  }

  getLayout(agentResults) {
    return agentResults.layout?.layouts?.[0] || {
      type: 'modern',
      description: 'Clean grid with generous whitespace'
    };
  }

  getMood(agentResults) {
    return agentResults.mood?.moods?.[0] || {
      name: 'Refined',
      description: 'Polished and sophisticated',
      tag: 'elegant'
    };
  }
}

// 1. Brand Identity Agent
class BrandIdentityAgent extends ServiceAgent {
  constructor() { super('Brand Identity Agent', 'brand_identity'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isLuxury = keywords.includes('luxury');
    const isModern = keywords.includes('modern');
    const isMinimal = keywords.includes('minimal');

    return {
      title: isLuxury ? 'Heritage Monogram' : isModern ? 'Dynamic Wordmark' : 'Signature Crest',
      description: `A ${isLuxury ? 'timeless monogram system' : isModern ? 'kinetic wordmark with motion-ready assets' : 'classic crest logo with versatile lockups'} designed for ${keywords.slice(0, 2).join(' + ')} brands. Includes primary logo, icon mark, color system, and typography guidelines.`,
      deliverables: ['Primary Logo (SVG, PNG, PDF)', 'Icon Mark', 'Color Palette', 'Typography Guide', 'Brand Guidelines (PDF)', 'Social Media Avatar Set'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: 'Golden ratio proportions' },
      mood,
      tags: ['brand-identity', 'logo', ...keywords.slice(0, 3)],
      template: {
        gradient: `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[1]} 100%)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

// 2. Social Media Design Agent
class SocialMediaAgent extends ServiceAgent {
  constructor() { super('Social Media Agent', 'social_media'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isBold = keywords.includes('bold');
    const isFashion = keywords.includes('fashion');

    return {
      title: isBold ? 'Impact Feed System' : isFashion ? 'Editorial Stories' : 'Carousel Canvas',
      description: `A ${isBold ? 'high-contrast feed system' : isFashion ? 'magazine-style story template set' : 'versatile carousel and post template system'} optimized for Instagram, Facebook, and TikTok. Includes 15+ reusable templates with smart object layers.`,
      deliverables: ['Instagram Feed Posts (9)', 'Instagram Stories (6)', 'Facebook Covers (2)', 'TikTok Video Frames (3)', 'Highlight Covers (6)', 'Canva / PSD Source Files'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: '1:1 and 9:16 ratios' },
      mood,
      tags: ['social-media', 'instagram', ...keywords.slice(0, 3)],
      template: {
        gradient: `linear-gradient(160deg, ${palette.colors[2]} 0%, ${palette.colors[0]} 50%, ${palette.colors[3]} 100%)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

// 3. Print & Marketing Agent
class PrintMarketingAgent extends ServiceAgent {
  constructor() { super('Print & Marketing Agent', 'print_marketing'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isTech = keywords.includes('tech');

    return {
      title: isTech ? 'Sleek Collateral Suite' : 'Tactile Print System',
      description: `A ${isTech ? 'minimal, data-forward print suite' : 'luxurious print collateral system'} including business cards, flyers, brochures, and letterhead. Print-ready with bleeds and CMYK-optimized palettes.`,
      deliverables: ['Business Cards (front + back)', 'A5 Flyer (2 designs)', 'Tri-fold Brochure', 'A4 Letterhead', 'Envelope Design', 'Print-Ready PDFs with bleed'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: 'Print-safe margins' },
      mood,
      tags: ['print', 'marketing', ...keywords.slice(0, 3)],
      template: {
        gradient: `linear-gradient(180deg, ${palette.colors[1]} 0%, ${palette.colors[0]} 100%)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

// 4. Product & Packaging Agent
class ProductPackagingAgent extends ServiceAgent {
  constructor() { super('Product & Packaging Agent', 'product_packaging'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isHealth = keywords.includes('health');
    const isFood = keywords.includes('food');

    return {
      title: isHealth ? 'Apothecary Label System' : isFood ? 'Artisan Food Packaging' : 'Modular Box Design',
      description: `A ${isHealth ? 'clean, pharmaceutical-grade label system' : isFood ? 'hand-crafted food packaging with appetite appeal' : 'structural packaging design with dieline-ready artwork'} for retail and e-commerce. Includes 3D mockups.`,
      deliverables: ['Primary Packaging Design', 'Label System (3 sizes)', 'Box / Sleeve Design', '3D Mockup (PNG)', 'Dieline Artwork (AI)', 'Material Spec Sheet'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: 'Dieline-safe zones' },
      mood,
      tags: ['packaging', 'product', ...keywords.slice(0, 3)],
      template: {
        gradient: `radial-gradient(ellipse at top, ${palette.colors[1]} 0%, ${palette.colors[0]} 60%)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

// 5. Website Graphics Agent
class WebsiteGraphicsAgent extends ServiceAgent {
  constructor() { super('Website Graphics Agent', 'website_graphics'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isTech = keywords.includes('tech');

    return {
      title: isTech ? 'SaaS Hero System' : 'Editorial Web Kit',
      description: `A ${isTech ? 'conversion-optimized web graphics kit with hero sections, feature cards, and CTA modules' : 'editorial-style web graphics kit with hero banners, icon sets, and content blocks'} optimized for WebP delivery and responsive scaling.`,
      deliverables: ['Hero Banner (3 sizes)', 'Feature Card Set (6)', 'Icon System (24 icons)', 'CTA Button Set', 'Background Patterns', 'Figma / Sketch Source File'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: '12-column responsive' },
      mood,
      tags: ['website', 'ui', ...keywords.slice(0, 3)],
      template: {
        gradient: `linear-gradient(135deg, ${palette.colors[0]} 0%, ${palette.colors[2]} 50%, ${palette.colors[3]} 100%)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

// 6. Event & Promotion Agent
class EventPromotionAgent extends ServiceAgent {
  constructor() { super('Event & Promotion Agent', 'event_promotion'); }

  generateConcept(brief, keywords, agentResults) {
    const palette = this.getPalette(keywords, agentResults);
    const typePair = this.getTypePair(agentResults);
    const layout = this.getLayout(agentResults);
    const mood = this.getMood(agentResults);

    const isBold = keywords.includes('bold');

    return {
      title: isBold ? 'Impact Campaign Kit' : 'Elegant Invitation Suite',
      description: `A ${isBold ? 'high-energy promotional campaign kit' : 'sophisticated event graphics suite'} including posters, banners, tickets, and digital invitations. Scalable from A6 flyers to rollup banners.`,
      deliverables: ['A2 Poster Design', 'Roll-up Banner (850x2000mm)', 'Event Ticket', 'Digital Invitation', 'Social Media Event Covers', 'Wayfinding Signage'],
      palette: palette.colors,
      typography: typePair,
      layout: { ...layout, grid: 'Scalable print + digital' },
      mood,
      tags: ['event', 'promotion', ...keywords.slice(0, 3)],
      template: {
        gradient: `conic-gradient(from 180deg at 50% 50%, ${palette.colors[0]} 0deg, ${palette.colors[2]} 180deg, ${palette.colors[1]} 360deg)`,
        primaryColor: palette.colors[0],
        accentColor: palette.colors[2]
      }
    };
  }
}

module.exports = {
  BrandIdentityAgent,
  SocialMediaAgent,
  PrintMarketingAgent,
  ProductPackagingAgent,
  WebsiteGraphicsAgent,
  EventPromotionAgent,
  extractKeywords
};
