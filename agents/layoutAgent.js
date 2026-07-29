/**
 * Layout Agent
 * Recommends grid systems and spatial organization
 * based on content type and brand goals.
 */

const layoutSystems = {
  editorial: {
    name: 'Editorial Grid',
    description: 'Asymmetric magazine-style layout with generous whitespace and dramatic scale contrasts',
    grid: '12-column asymmetric',
    whitespace: 'high',
    bestFor: ['luxury', 'fashion', 'editorial']
  },
  modular: {
    name: 'Modular Card System',
    description: 'Flexible card-based grid that adapts to various content types while maintaining visual rhythm',
    grid: '4-column modular',
    whitespace: 'medium',
    bestFor: ['tech', 'minimal', 'modern']
  },
  classical: {
    name: 'Classical Proportion',
    description: 'Golden ratio-based layout with centered symmetry and Renaissance proportions',
    grid: 'golden ratio',
    whitespace: 'high',
    bestFor: ['luxury', 'vintage', 'heritage']
  },
  broken: {
    name: 'Broken Grid',
    description: 'Overlapping elements with intentional misalignment for dynamic, energetic compositions',
    grid: 'freeform',
    whitespace: 'low',
    bestFor: ['bold', 'creative', 'fashion']
  },
  bento: {
    name: 'Bento Box',
    description: 'Tightly organized variable-size cells in a cohesive container',
    grid: 'variable cell',
    whitespace: 'low',
    bestFor: ['tech', 'modern', 'product']
  },
  split: {
    name: 'Split Screen',
    description: 'Clean 50/50 or 60/40 divisions with strong visual separation',
    grid: '2-column fixed',
    whitespace: 'medium',
    bestFor: ['minimal', 'health', 'corporate']
  }
};

class LayoutAgent {
  async analyze(brief, keywords, otherResults, options) {
    const { log } = options;
    await log('Analyzing spatial requirements and content structure...');

    // Score layout systems against keywords
    const scored = Object.entries(layoutSystems).map(([key, system]) => {
      let score = 0;
      system.bestFor.forEach(bf => {
        if (keywords.includes(bf)) score += 3;
      });
      // Brief length suggests complexity
      if (brief.length > 200 && system.whitespace === 'high') score += 1;
      return { key, ...system, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];

    await log(`Selected layout: ${selected.name} (${selected.grid})`);
    await log(`Whitespace level: ${selected.whitespace}`);

    // Generate responsive behavior
    const responsive = this.generateResponsive(selected);
    await log(`Responsive strategy: ${responsive.strategy}`);

    return {
      layouts: scored.slice(0, 3).map(s => ({
        type: s.key,
        name: s.name,
        description: s.description
      })),
      selected: {
        type: selected.key,
        name: selected.name,
        description: selected.description,
        grid: selected.grid,
        whitespace: selected.whitespace
      },
      responsive,
      analysis: {
        complexity: this.assessComplexity(brief),
        contentDensity: selected.whitespace === 'high' ? 'low' : 'high',
        visualRhythm: this.describeRhythm(selected)
      }
    };
  }

  generateResponsive(layout) {
    const strategies = {
      editorial: 'Stack asymmetric columns into single column, preserve scale contrast',
      modular: '2 columns tablet, 1 column mobile, maintain card proportions',
      classical: 'Maintain centered symmetry at all breakpoints',
      broken: 'Reduce overlaps, increase spacing on smaller screens',
      bento: 'Single column scroll, preserve cell grouping logic',
      split: 'Stack vertically on mobile, maintain 60/40 on tablet'
    };

    return {
      strategy: strategies[layout.key] || 'Fluid grid adaptation',
      breakpoints: {
        desktop: '1200px+ — Full layout',
        tablet: '768px–1199px — Adjusted grid',
        mobile: '<768px — Single column'
      }
    };
  }

  assessComplexity(brief) {
    const length = brief.length;
    if (length < 100) return 'simple';
    if (length < 300) return 'moderate';
    return 'complex';
  }

  describeRhythm(layout) {
    const rhythms = {
      editorial: 'Dramatic pacing with visual rests',
      modular: 'Consistent beat, predictable rhythm',
      classical: 'Harmonious, measured progression',
      broken: 'Syncopated, energetic pulse',
      bento: 'Dense, information-rich flow',
      split: 'Balanced, steady cadence'
    };
    return rhythms[layout.key] || 'Adaptive rhythm';
  }

  getFallback(brief, keywords) {
    return {
      layouts: [
        { type: 'editorial', name: 'Editorial Grid', description: 'Asymmetric magazine-style layout' },
        { type: 'modular', name: 'Modular Card System', description: 'Flexible card-based grid' }
      ],
      selected: {
        type: 'editorial',
        name: 'Editorial Grid',
        description: 'Asymmetric magazine-style layout with generous whitespace',
        grid: '12-column',
        whitespace: 'high'
      },
      responsive: { strategy: 'Fluid grid adaptation', breakpoints: {} },
      analysis: { complexity: 'moderate', contentDensity: 'low', visualRhythm: 'Adaptive' }
    };
  }
}

module.exports = new LayoutAgent();
