/**
 * Typography Agent
 * Recommends font pairings based on brand personality,
 * industry standards, and readability requirements.
 */

const fontDatabase = {
  serif: [
    { name: 'Cormorant Garamond', personality: 'elegant classical', use: 'luxury editorial' },
    { name: 'Playfair Display', personality: 'bold editorial', use: 'fashion magazines' },
    { name: 'Bodoni Moda', personality: 'high-contrast dramatic', use: 'fashion luxury' },
    { name: 'Libre Baskerville', personality: 'readable classic', use: 'editorial long-form' },
    { name: 'Cinzel', personality: 'ancient roman', use: 'heritage luxury' }
  ],
  sans: [
    { name: 'Inter', personality: 'neutral modern', use: 'tech corporate' },
    { name: 'DM Sans', personality: 'friendly geometric', use: 'startup consumer' },
    { name: 'Space Grotesk', personality: 'quirky modern', use: 'creative tech' },
    { name: 'Manrope', personality: 'soft geometric', use: 'health wellness' },
    { name: 'Montserrat', personality: 'versatile modern', use: 'universal' }
  ],
  display: [
    { name: 'Oswald', personality: 'condensed bold', use: 'headlines posters' },
    { name: 'Bebas Neue', personality: 'all-caps impact', use: 'fashion editorial' },
    { name: 'Clash Display', personality: 'geometric modern', use: 'branding headlines' }
  ]
};

const pairingRules = {
  luxury: { primary: 'serif', secondary: 'sans', ratio: 'contrast' },
  minimal: { primary: 'sans', secondary: 'sans', ratio: 'harmony' },
  tech: { primary: 'sans', secondary: 'sans', ratio: 'harmony' },
  editorial: { primary: 'serif', secondary: 'serif', ratio: 'harmony' },
  bold: { primary: 'display', secondary: 'sans', ratio: 'contrast' },
  fashion: { primary: 'serif', secondary: 'sans', ratio: 'contrast' }
};

class TypographyAgent {
  async analyze(brief, keywords, otherResults, options) {
    const { log } = options;
    await log('Analyzing typographic personality...');

    // Determine pairing strategy
    let strategy = pairingRules.modern;
    for (const kw of keywords) {
      if (pairingRules[kw]) {
        strategy = pairingRules[kw];
        break;
      }
    }

    await log(`Selected strategy: ${strategy.primary} + ${strategy.secondary} (${strategy.ratio})`);

    // Select primary font
    const primaryPool = fontDatabase[strategy.primary];
    const secondaryPool = fontDatabase[strategy.secondary];

    const primary = this.selectByKeywords(primaryPool, keywords);
    const secondary = this.selectByKeywords(secondaryPool, keywords, primary.name);

    await log(`Primary: ${primary.name} — ${primary.personality}`);
    await log(`Secondary: ${secondary.name} — ${secondary.personality}`);

    // Generate pairings
    const pairs = [];
    const variations = [
      { primary: primary.name, secondary: secondary.name },
      { primary: primaryPool[(primaryPool.indexOf(primary) + 1) % primaryPool.length].name, secondary: secondary.name },
      { primary: primary.name, secondary: secondaryPool[(secondaryPool.indexOf(secondary) + 1) % secondaryPool.length].name }
    ];

    return {
      pairs: variations,
      selected: variations[0],
      analysis: {
        strategy: strategy.ratio,
        personality: primary.personality,
        readability: this.scoreReadability(primary, secondary),
        hierarchy: this.generateHierarchy(primary, secondary)
      }
    };
  }

  selectByKeywords(pool, keywords, exclude) {
    const scored = pool.map(font => {
      let score = 0;
      const fp = font.personality.toLowerCase();
      const fu = font.use.toLowerCase();
      keywords.forEach(kw => {
        if (fp.includes(kw)) score += 3;
        if (fu.includes(kw)) score += 2;
      });
      if (font.name === exclude) score -= 10;
      return { ...font, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  scoreReadability(primary, secondary) {
    // Simulate readability scoring
    const scores = ['excellent', 'very good', 'good', 'moderate'];
    return scores[Math.floor(Math.random() * 2)];
  }

  generateHierarchy(primary, secondary) {
    return {
      h1: { font: primary.name || primary, size: 'clamp(3rem, 8vw, 7rem)', weight: 400 },
      h2: { font: primary.name || primary, size: 'clamp(2rem, 4vw, 3.5rem)', weight: 400 },
      body: { font: secondary.name || secondary, size: '1rem', weight: 400 },
      caption: { font: secondary.name || secondary, size: '0.75rem', weight: 500 }
    };
  }

  getFallback(brief, keywords) {
    return {
      pairs: [
        { primary: 'Cormorant Garamond', secondary: 'Inter' },
        { primary: 'Playfair Display', secondary: 'DM Sans' }
      ],
      selected: { primary: 'Cormorant Garamond', secondary: 'Inter' },
      analysis: { strategy: 'contrast', personality: 'elegant classical', readability: 'excellent' }
    };
  }
}

module.exports = new TypographyAgent();
