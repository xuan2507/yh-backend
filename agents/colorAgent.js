/**
 * Color Agent
 * Analyzes briefs and generates color palettes using
 * color theory principles and brand psychology.
 */

const colorPsychology = {
  luxury: { hues: ['#0f0f0f', '#1a1714', '#c9a227', '#d4af37'], approach: 'Deep blacks with metallic gold accents' },
  minimal: { hues: ['#fafafa', '#f0f0f0', '#1a1a1a', '#888888'], approach: 'Monochromatic with single accent' },
  soft: { hues: ['#f5f0e8', '#e8e0d4', '#c4b496', '#8a7a5c'], approach: 'Warm earth tones with cream bases' },
  bold: { hues: ['#0a0a0a', '#ff6b9d', '#c9a227', '#ffffff'], approach: 'High contrast with vibrant accent' },
  health: { hues: ['#ffffff', '#e8f5e9', '#4caf50', '#2e7d32'], approach: 'Clean whites with organic greens' },
  tech: { hues: ['#0a0a0a', '#1a1a2e', '#6c5ce7', '#74b9ff'], approach: 'Dark mode with electric accents' },
  food: { hues: ['#1a1714', '#e17055', '#fab1a0', '#f5f0e8'], approach: 'Warm appetizing tones on dark' },
  fashion: { hues: ['#0f0f0f', '#ddd5c5', '#b8954a', '#5a5548'], approach: 'Runway blacks with champagne accents' }
};

const basePalettes = [
  { name: 'Classical Gold', colors: ['#1a1714', '#f5f0e8', '#b8954a', '#5a5548'], warmth: 'warm', contrast: 'high' },
  { name: 'Midnight Luxe', colors: ['#0a0a0a', '#1a1714', '#c9a227', '#e8e0d4'], warmth: 'neutral', contrast: 'high' },
  { name: 'Cream Stone', colors: ['#faf6f0', '#e8e0d4', '#c4b496', '#8a7a5c'], warmth: 'warm', contrast: 'low' },
  { name: 'Digital Noir', colors: ['#0a0a0a', '#1a1a2e', '#6c5ce7', '#74b9ff'], warmth: 'cool', contrast: 'high' },
  { name: 'Rose Gold', colors: ['#1a1714', '#f5f0e8', '#e17055', '#fab1a0'], warmth: 'warm', contrast: 'medium' },
  { name: 'Forest & Cream', colors: ['#1a1714', '#f5f0e8', '#2d5016', '#a8c686'], warmth: 'neutral', contrast: 'medium' },
  { name: 'Navy Elegance', colors: ['#0a1628', '#f5f0e8', '#1e3a5f', '#c9a227'], warmth: 'cool', contrast: 'high' },
  { name: 'Terracotta', colors: ['#3e2723', '#f5f0e8', '#d84315', '#ffab91'], warmth: 'warm', contrast: 'medium' }
];

class ColorAgent {
  async analyze(brief, keywords, otherResults, options) {
    const { log } = options;
    await log('Analyzing color psychology for target audience...');

    // Score each palette against keywords
    const scored = basePalettes.map(palette => {
      let score = 0;
      const paletteStr = palette.colors.join(' ').toLowerCase();
      const briefStr = brief.toLowerCase();

      // Match against color psychology profiles
      for (const [category, profile] of Object.entries(colorPsychology)) {
        if (keywords.includes(category)) {
          const matches = profile.hues.filter(h => palette.colors.includes(h)).length;
          score += matches * 2;
        }
      }

      // Check for color mentions in brief
      const colorMentions = ['gold', 'black', 'white', 'blue', 'green', 'red', 'pink', 'navy', 'cream'];
      colorMentions.forEach(c => {
        if (briefStr.includes(c) && paletteStr.includes(c)) score += 3;
      });

      // Industry alignment
      if (keywords.includes('luxury') && palette.contrast === 'high') score += 2;
      if (keywords.includes('minimal') && palette.contrast === 'low') score += 2;
      if (keywords.includes('soft') && palette.warmth === 'warm') score += 2;

      return { ...palette, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topPalettes = scored.slice(0, 4);

    await log(`Selected ${topPalettes.length} palettes based on keyword analysis`);
    topPalettes.forEach((p, i) => {
      log(`  ${i + 1}. ${p.name} (score: ${p.score})`);
    });

    // Generate variations
    await log('Generating palette variations...');
    const variations = topPalettes.map(p => this.createVariation(p));

    return {
      palettes: [...topPalettes, ...variations],
      selected: topPalettes[0],
      analysis: {
        warmth: topPalettes[0].warmth,
        contrast: topPalettes[0].contrast,
        reasoning: this.generateReasoning(keywords, topPalettes[0])
      }
    };
  }

  createVariation(base) {
    // Slight modification of a base palette
    const shift = (hex, amount) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };

    return {
      name: `${base.name} Alt`,
      colors: base.colors.map((c, i) => i === 2 ? shift(c, 20) : c),
      warmth: base.warmth,
      contrast: base.contrast,
      isVariation: true
    };
  }

  generateReasoning(keywords, palette) {
    const reasons = [];
    if (keywords.includes('luxury')) reasons.push('High contrast supports premium positioning');
    if (keywords.includes('minimal')) reasons.push('Restrained palette reduces visual noise');
    if (keywords.includes('soft')) reasons.push('Warm tones create approachable feeling');
    if (keywords.includes('bold')) reasons.push('Strong contrast commands attention');
    if (palette.warmth === 'warm') reasons.push('Warm palette evokes trust and comfort');
    return reasons.join('. ') || 'Balanced palette for broad appeal';
  }

  getFallback(brief, keywords) {
    const defaultPalette = basePalettes[0];
    return {
      palettes: basePalettes.slice(0, 3),
      selected: defaultPalette,
      analysis: { warmth: 'warm', contrast: 'high', reasoning: 'Default classical palette' }
    };
  }
}

module.exports = new ColorAgent();
