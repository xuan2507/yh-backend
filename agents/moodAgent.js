/**
 * Mood Agent
 * Defines the emotional atmosphere, visual texture,
 * and atmospheric qualities of the brand direction.
 */

const moodProfiles = {
  refined: {
    name: 'Refined Elegance',
    description: 'Polished surfaces, subtle textures, and controlled restraint create an atmosphere of quiet confidence',
    textures: ['subtle grain', 'matte finish', 'soft shadows'],
    atmosphere: 'understated luxury',
    photography: 'soft natural light, shallow depth of field',
    motion: 'slow, deliberate transitions',
    bestFor: ['luxury', 'fashion', 'heritage']
  },
  bold: {
    name: 'Bold Impact',
    description: 'High contrast, sharp edges, and confident presence that commands immediate attention',
    textures: ['halftone dots', 'sharp angles', 'solid blocks'],
    atmosphere: 'energetic confidence',
    photography: 'dramatic lighting, strong shadows',
    motion: 'quick cuts, bold reveals',
    bestFor: ['bold', 'tech', 'creative']
  },
  serene: {
    name: 'Serene Balance',
    description: 'Calm compositions with breathing room and harmonious proportions that invite contemplation',
    textures: ['soft gradients', 'organic curves', 'diffused light'],
    atmosphere: 'peaceful clarity',
    photography: 'even lighting, clean backgrounds',
    motion: 'smooth, flowing animations',
    bestFor: ['health', 'wellness', 'minimal']
  },
  vintage: {
    name: 'Vintage Nostalgia',
    description: 'Worn textures, warm tones, and analog imperfections evoke timeless authenticity',
    textures: ['paper grain', 'ink bleed', 'film grain'],
    atmosphere: 'authentic warmth',
    photography: 'warm tones, film emulation',
    motion: 'gentle fades, subtle vignettes',
    bestFor: ['vintage', 'food', 'artisan']
  },
  futuristic: {
    name: 'Futuristic Edge',
    description: 'Clean lines, digital precision, and forward-looking aesthetics signal innovation',
    textures: ['glass reflections', 'holographic sheen', 'micro-patterns'],
    atmosphere: 'innovative clarity',
    photography: 'studio lighting, reflective surfaces',
    motion: 'smooth morphs, precise easing',
    bestFor: ['tech', 'modern', 'startup']
  },
  organic: {
    name: 'Organic Living',
    description: 'Natural forms, earthy textures, and fluid shapes connect with fundamental human instincts',
    textures: ['natural fiber', 'watercolor bleed', 'leaf veins'],
    atmosphere: 'grounded vitality',
    photography: 'natural light, environmental context',
    motion: 'organic curves, growth animations',
    bestFor: ['health', 'food', 'wellness']
  }
};

class MoodAgent {
  async analyze(brief, keywords, otherResults, options) {
    const { log } = options;
    await log('Analyzing emotional resonance and brand atmosphere...');

    // Score mood profiles
    const scored = Object.entries(moodProfiles).map(([key, profile]) => {
      let score = 0;
      profile.bestFor.forEach(bf => {
        if (keywords.includes(bf)) score += 3;
      });
      // Cross-reference with color agent results
      if (otherResults.color) {
        const warmth = otherResults.color.analysis?.warmth;
        if (warmth === 'warm' && (key === 'vintage' || key === 'organic')) score += 1;
        if (warmth === 'cool' && (key === 'futuristic' || key === 'serene')) score += 1;
      }
      return { key, ...profile, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];

    await log(`Selected mood: ${selected.name}`);
    await log(`Atmosphere: ${selected.atmosphere}`);

    // Generate art direction notes
    const artDirection = this.generateArtDirection(selected, keywords);
    await log(`Art direction: ${artDirection.photographyStyle}`);

    return {
      moods: scored.slice(0, 3).map(m => ({
        name: m.name,
        description: m.description,
        atmosphere: m.atmosphere
      })),
      selected: {
        name: selected.name,
        description: selected.description,
        atmosphere: selected.atmosphere,
        textures: selected.textures,
        photography: selected.photography,
        motion: selected.motion
      },
      artDirection,
      analysis: {
        emotionalTarget: this.identifyEmotion(keywords),
        brandArchetype: this.identifyArchetype(keywords),
        sensoryProfile: this.describeSensory(selected)
      }
    };
  }

  generateArtDirection(mood, keywords) {
    const isLuxury = keywords.includes('luxury');
    return {
      photographyStyle: mood.photography,
      lightingApproach: isLuxury ? 'dramatic chiaroscuro' : 'natural even lighting',
      colorTreatment: mood.key === 'vintage' ? 'warm film emulation' : 'true to brand palette',
      composition: mood.key === 'bold' ? 'asymmetric with tension' : 'balanced with breathing room',
      textureOverlay: mood.textures[0],
      animationStyle: mood.motion
    };
  }

  identifyEmotion(keywords) {
    const emotionMap = {
      luxury: 'aspiration',
      bold: 'excitement',
      soft: 'comfort',
      minimal: 'clarity',
      vintage: 'nostalgia',
      tech: 'curiosity'
    };
    for (const kw of keywords) {
      if (emotionMap[kw]) return emotionMap[kw];
    }
    return 'trust';
  }

  identifyArchetype(keywords) {
    const archetypes = {
      luxury: 'Ruler',
      bold: 'Hero',
      soft: 'Caregiver',
      minimal: 'Sage',
      tech: 'Magician',
      vintage: 'Creator',
      health: 'Innocent'
    };
    for (const kw of keywords) {
      if (archetypes[kw]) return archetypes[kw];
    }
    return 'Explorer';
  }

  describeSensory(mood) {
    return {
      visual: mood.textures.join(', '),
      tactile: mood.key === 'luxury' ? 'smooth, weighty' : 'natural, approachable',
      temporal: mood.key === 'vintage' ? 'timeless, enduring' : 'contemporary, relevant'
    };
  }

  getFallback(brief, keywords) {
    const defaultMood = moodProfiles.refined;
    return {
      moods: [
        { name: 'Refined Elegance', description: defaultMood.description, atmosphere: defaultMood.atmosphere }
      ],
      selected: {
        name: defaultMood.name,
        description: defaultMood.description,
        atmosphere: defaultMood.atmosphere,
        textures: defaultMood.textures,
        photography: defaultMood.photography,
        motion: defaultMood.motion
      },
      artDirection: this.generateArtDirection({ ...defaultMood, key: 'refined' }, keywords),
      analysis: { emotionalTarget: 'trust', brandArchetype: 'Explorer', sensoryProfile: {} }
    };
  }
}

module.exports = new MoodAgent();
