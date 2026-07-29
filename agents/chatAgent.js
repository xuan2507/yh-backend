/**
 * AI Chat Agent — Multi-Persona Design Consultant
 * Handles: Sales, Brand Consultant, Creative Director, Project Manager,
 *          Prompt Engineer, Quote Generator, Marketing Strategist, Trend Expert
 */

const colorAgent = require('./colorAgent');

const PERSONAS = {
  sales: {
    name: 'Sales Consultant',
    tone: 'professional, consultative, persuasive',
    goal: 'Qualify leads, recommend packages, upsell, book consultations'
  },
  brand: {
    name: 'Brand Consultant',
    tone: 'insightful, creative, structured',
    goal: 'Help clients build brand identity through guided questions'
  },
  creative: {
    name: 'Creative Director',
    tone: 'honest, expert, constructive',
    goal: 'Give professional design feedback using design principles'
  },
  pm: {
    name: 'Project Manager',
    tone: 'organized, clear, systematic',
    goal: 'Define scope, gather requirements, estimate timelines'
  },
  prompt: {
    name: 'Prompt Engineer',
    tone: 'technical, precise, creative',
    goal: 'Convert descriptions into detailed AI generation prompts'
  },
  quote: {
    name: 'Quote Generator',
    tone: 'transparent, business-minded',
    goal: 'Estimate pricing based on complexity and deliverables'
  },
  marketing: {
    name: 'Marketing Strategist',
    tone: 'strategic, growth-oriented',
    goal: 'Recommend branding and marketing strategies'
  },
  trend: {
    name: 'Trend Expert',
    tone: 'knowledgeable, current, inspiring',
    goal: 'Explain current design trends by industry'
  }
};

const PACKAGES = {
  starter: { name: 'Starter', price: 299, days: 2, includes: ['1 logo concept', '3 revisions', 'Business card', '5 social templates', 'Source files'] },
  professional: { name: 'Professional', price: 799, days: 5, includes: ['3 logo concepts', 'Unlimited revisions', 'Full brand identity', '15 social templates', 'Brand guidelines', 'Marketing collateral'] },
  enterprise: { name: 'Enterprise', price: null, days: 'custom', includes: ['Everything in Pro', 'Monthly retainer', 'Priority 24-48h', 'Packaging & web', 'Dedicated support'] }
};

const TRENDS = {
  luxury: ['Serif typography revival', 'Black & gold palettes', 'Generous whitespace', 'Embossed textures', 'Monogram logos'],
  tech: ['Glassmorphism', 'Neon accents on dark', 'Geometric sans-serifs', 'Micro-animations', 'Gradient meshes'],
  fashion: ['Brutalist layouts', 'Oversized typography', 'Collage aesthetics', 'Metallic finishes', 'Minimalist photography'],
  food: ['Hand-drawn illustrations', 'Earthy color palettes', 'Vintage typography', 'Kraft paper textures', 'Organic shapes'],
  health: ['Soft gradients', 'Pastel palettes', 'Rounded geometry', 'Breathing whitespace', 'Nature photography'],
  fitness: ['Bold condensed type', 'High contrast', 'Electric accents', 'Dynamic angles', 'Urban photography']
};

class ChatAgent {
  constructor() {
    this.sessions = new Map(); // Simple in-memory session storage
  }

  async chat(sessionId, message, persona = 'sales') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { history: [], context: {}, stage: 'greeting' });
    }
    const session = this.sessions.get(sessionId);
    session.history.push({ role: 'user', text: message, time: Date.now() });

    const response = await this.generateResponse(persona, message, session);
    session.history.push({ role: 'bot', text: response.text, persona, time: Date.now() });

    return response;
  }

  async generateResponse(persona, message, session) {
    const lower = message.toLowerCase();
    const ctx = session.context;

    switch (persona) {
      case 'sales':
        return this.handleSales(message, lower, ctx, session);
      case 'brand':
        return this.handleBrand(message, lower, ctx, session);
      case 'creative':
        return this.handleCreative(message, lower, ctx);
      case 'pm':
        return this.handlePM(message, lower, ctx, session);
      case 'prompt':
        return this.handlePrompt(message, lower, ctx);
      case 'quote':
        return this.handleQuote(message, lower, ctx);
      case 'marketing':
        return this.handleMarketing(message, lower, ctx);
      case 'trend':
        return this.handleTrend(message, lower, ctx);
      default:
        return { text: "I'm here to help. Which area would you like to explore: sales, branding, design feedback, project planning, or trends?", actions: [] };
    }
  }

  handleSales(message, lower, ctx, session) {
    // Extract business info
    if (!ctx.industry) {
      const industries = ['coffee', 'cafe', 'restaurant', 'tech', 'startup', 'fashion', 'clothing', 'gym', 'fitness', 'health', 'skincare', 'beauty', 'hotel', 'real estate', 'consulting', 'law', 'food', 'bakery'];
      for (const ind of industries) {
        if (lower.includes(ind)) { ctx.industry = ind; break; }
      }
    }
    if (!ctx.budget) {
      if (lower.includes('299') || lower.includes('starter') || lower.includes('cheap') || lower.includes('small')) ctx.budget = 'starter';
      if (lower.includes('799') || lower.includes('professional') || lower.includes('mid')) ctx.budget = 'professional';
      if (lower.includes('custom') || lower.includes('enterprise') || lower.includes('big')) ctx.budget = 'enterprise';
    }

    // Stage-based conversation
    if (session.stage === 'greeting') {
      session.stage = 'qualify';
      return { text: "Welcome to YH Studio. I'm here to find the perfect design solution for your business. What industry are you in, and what type of design work do you need?", actions: [] };
    }

    if (session.stage === 'qualify') {
      session.stage = 'recommend';
      const pkg = this.recommendPackage(ctx);
      return {
        text: `Based on what you've shared, I recommend our **${pkg.name} Package** at ${pkg.price ? '$' + pkg.price : 'custom pricing'}.

**Includes:**
${pkg.includes.map(i => '• ' + i).join('\n')}

**Timeline:** ${pkg.days} business day${pkg.days !== 1 ? 's' : ''}

Would you like to proceed with this package, or would you prefer a different option?`,
        actions: [
          { label: 'Book Consultation', value: 'book' },
          { label: 'Compare Packages', value: 'compare' },
          { label: 'Ask Questions', value: 'ask' }
        ]
      };
    }

    if (lower.includes('compare') || lower.includes('difference') || lower.includes('option')) {
      return {
        text: `**Package Comparison:**

**Starter — $299**
Best for: New businesses, quick turnaround
• 1 logo concept, 3 revisions
• Business card + 5 social templates
• 2-day delivery

**Professional — $799** ⭐ Most Popular
Best for: Growing brands needing full identity
• 3 logo concepts, unlimited revisions
• Full brand system + 15 social templates
• Brand guidelines + marketing collateral
• 5-day delivery

**Enterprise — Custom**
Best for: Established brands, ongoing needs
• Everything in Professional
• Monthly retainer, priority support
• Packaging, web graphics, dedicated support`,
        actions: []
      };
    }

    if (lower.includes('book') || lower.includes('consult') || lower.includes('meeting') || lower.includes('start')) {
      return {
        text: "Excellent choice. Please fill out the contact form below with your details, and I'll flag your inquiry for priority handling. Our team typically responds within 2 hours during business hours.",
        actions: [{ label: 'Go to Contact Form', value: 'contact' }]
      };
    }

    return {
      text: `I understand you're in the ${ctx.industry || 'business'} space. Our AI-enhanced workflow means you'll see first concepts within 24 hours. Would you like me to generate a custom quote, or do you have questions about the process?`,
      actions: [{ label: 'Get Quote', value: 'quote' }, { label: 'See Process', value: 'process' }]
    };
  }

  recommendPackage(ctx) {
    if (ctx.budget === 'starter') return PACKAGES.starter;
    if (ctx.budget === 'enterprise') return PACKAGES.enterprise;
    return PACKAGES.professional;
  }

  handleBrand(message, lower, ctx, session) {
    if (!ctx.industry) {
      const industries = ['coffee', 'cafe', 'restaurant', 'tech', 'startup', 'fashion', 'clothing', 'gym', 'fitness', 'health', 'skincare', 'beauty', 'hotel', 'food'];
      for (const ind of industries) {
        if (lower.includes(ind)) { ctx.industry = ind; break; }
      }
    }

    if (!ctx.industry) {
      return { text: "I'd love to help you build your brand identity. What industry is your business in? (e.g., coffee shop, tech startup, fashion, fitness)", actions: [] };
    }

    const brandProfiles = {
      coffee: { palette: 'Warm earth tones — deep browns, cream, terracotta', logo: 'Minimal circular mark or coffee bean icon', type: 'Rounded sans-serif for warmth, serif for tradition', personality: 'Friendly, artisanal, approachable', packaging: 'Kraft paper, minimal labels, hand-stamped feel' },
      tech: { palette: 'Dark navy or black with electric blue or purple accents', logo: 'Geometric, abstract mark with sharp angles', type: 'Clean geometric sans-serif (Inter, Space Grotesk)', personality: 'Innovative, precise, forward-thinking', packaging: 'Minimal, matte finishes, holographic accents' },
      fashion: { palette: 'Black, white, with one accent color (red, gold, or blush)', logo: 'Elegant wordmark or monogram', type: 'High-contrast serif (Bodoni, Didot)', personality: 'Sophisticated, aspirational, editorial', packaging: 'Tissue paper, ribbon, embossed logos' },
      gym: { palette: 'High contrast — black, red, or neon on dark', logo: 'Bold, angular mark or animal mascot', type: 'Condensed, bold sans-serif (Oswald, Bebas Neue)', personality: 'Powerful, energetic, disciplined', packaging: 'Metallic finishes, bold typography' },
      health: { palette: 'Soft greens, whites, and pale blues', logo: 'Organic shapes, leaf or water motifs', type: 'Soft geometric sans (Manrope, DM Sans)', personality: 'Calm, trustworthy, nurturing', packaging: 'Recycled materials, botanical illustrations' }
    };

    const profile = brandProfiles[ctx.industry] || brandProfiles.coffee;

    return {
      text: `**Brand Identity Recommendations for ${ctx.industry.charAt(0).toUpperCase() + ctx.industry.slice(1)}:**

**Color Palette:** ${profile.palette}

**Logo Direction:** ${profile.logo}

**Typography:** ${profile.type}

**Brand Personality:** ${profile.personality}

**Packaging:** ${profile.packaging}

Would you like me to generate a detailed brand brief or create AI concept previews?`,
      actions: [
        { label: 'Generate Concepts', value: 'concepts' },
        { label: 'Create Brief', value: 'brief' },
        { label: 'Get Quote', value: 'quote' }
      ]
    };
  }

  handleCreative(message, lower, ctx) {
    const feedbackTemplates = [
      {
        trigger: ['logo', 'mark', 'symbol'],
        response: `**Logo Analysis:**

• **Scalability:** Test your logo at 16px favicon size. If details are lost, simplify.
• **Balance:** The visual weight should feel centered. If the icon is heavy on one side, adjust spacing.
• **Recognition:** A strong logo is memorable in 3 seconds. Remove elements that don't serve immediate recognition.
• **Versatility:** Ensure it works in single color (black on white, white on black).

**Suggestion:** Increase the icon-to-wordmark ratio slightly. The typography competes with the mark for attention.`
      },
      {
        trigger: ['typography', 'font', 'text', 'type'],
        response: `**Typography Feedback:**

• **Hierarchy:** Your heading and body text need at least a 2:1 size ratio. Currently the contrast feels flat.
• **Line Height:** Increase line spacing to 1.5x for body text. Tight lines reduce readability by ~20%.
• **Pairing:** The display font and body font share similar weights, creating visual confusion. Try increasing the weight contrast.
• **Measure:** Keep line length between 45-75 characters for optimal reading comfort.

**Suggestion:** Use a lighter weight for body copy and increase the heading size by 15%.`
      },
      {
        trigger: ['color', 'palette', 'scheme'],
        response: `**Color Analysis:**

• **Contrast Ratio:** Ensure text meets WCAG AA standards (4.5:1 for normal text). Your secondary color may be too light.
• **Emotional Resonance:** Warm tones build trust; cool tones signal professionalism. Consider your audience's expectations.
• **Accent Usage:** Use your accent color for no more than 10% of the design to maintain focus.
• **Accessibility:** Test your palette with color-blind simulators. Red-green combinations affect ~8% of males.

**Suggestion:** Darken your secondary text color by 15% for better legibility.`
      }
    ];

    for (const template of feedbackTemplates) {
      if (template.trigger.some(t => lower.includes(t))) {
        return { text: template.response, actions: [{ label: 'Get Full Review', value: 'review' }] };
      }
    }

    return {
      text: `**General Design Principles:**

• **Contrast:** Strong contrast between elements creates visual hierarchy. Without it, everything competes for attention.
• **Alignment:** Consistent alignment creates order. Even small misalignments feel unprofessional.
• **Proximity:** Related elements should be closer together than unrelated ones. This organizes information naturally.
• **Repetition:** Repeating colors, fonts, and shapes creates cohesion across all brand materials.

Share a specific design element (logo, typography, colors, layout) and I'll give targeted feedback.`,
      actions: []
    };
  }

  handlePM(message, lower, ctx, session) {
    if (session.stage === 'greeting') {
      session.stage = 'scope';
      return { text: "I'll help you define your project scope. What deliverables do you need? (e.g., logo, brand guidelines, social media kit, website graphics)", actions: [] };
    }

    if (session.stage === 'scope') {
      session.stage = 'timeline';
      ctx.deliverables = message;
      return { text: "Great. What's your target timeline? Are there any hard deadlines (e.g., product launch, event)?", actions: [] };
    }

    if (session.stage === 'timeline') {
      session.stage = 'audience';
      ctx.timeline = message;
      return { text: "Who is your target audience? Age range, preferences, and where they'll encounter your brand?", actions: [] };
    }

    if (session.stage === 'audience') {
      session.stage = 'complete';
      ctx.audience = message;

      const brief = `**DESIGN BRIEF — Generated by AI Project Manager**

**Project Scope:** ${ctx.deliverables || 'Brand identity system'}
**Timeline:** ${ctx.timeline || 'Standard 5-7 business days'}
**Target Audience:** ${ctx.audience || 'General consumer'}
**Industry:** ${ctx.industry || 'Not specified'}

**Deliverables Checklist:**
□ Logo concepts (3 directions)
□ Color palette & typography
□ Brand guidelines document
□ Social media templates
□ Source files (AI, PSD, PDF)

**Next Steps:**
1. Review and approve concepts
2. Revision rounds (unlimited on Professional+)
3. Final delivery with source files

This brief is ready to send to our design team. Would you like to submit it now?`;

      return { text: brief, actions: [{ label: 'Submit Brief', value: 'submit' }] };
    }

    return { text: "Your project brief is complete. You can submit it through our contact form, and we'll begin AI concept generation within 2 hours.", actions: [{ label: 'Submit Now', value: 'contact' }] };
  }

  handlePrompt(message, lower, ctx) {
    const enhancedPrompt = this.enhancePrompt(message);
    return {
      text: `**AI-Optimized Prompt:**

\`\`\`
${enhancedPrompt}
\`\`\`

This prompt includes style references, lighting, composition, and color direction to maximize output quality from AI image generators.`,
      actions: [{ label: 'Generate Concepts', value: 'concepts' }]
    };
  }

  enhancePrompt(description) {
    const base = description.trim();
    return `Create a premium brand design: ${base}. 
Style: Clean, professional, high-end aesthetic.
Composition: Centered, balanced, generous whitespace.
Colors: Harmonious palette with strong contrast.
Typography: Elegant display font paired with readable body text.
Mood: Sophisticated yet approachable.
Render: High resolution, vector-ready, print quality.`;
  }

  handleQuote(message, lower, ctx) {
    // Parse complexity signals
    let complexity = 1;
    if (lower.includes('logo') || lower.includes('brand')) complexity += 1;
    if (lower.includes('website') || lower.includes('web')) complexity += 2;
    if (lower.includes('packaging') || lower.includes('package')) complexity += 2;
    if (lower.includes('social') || lower.includes('instagram')) complexity += 1;
    if (lower.includes('urgent') || lower.includes('rush') || lower.includes('fast')) complexity += 1;
    if (lower.includes('unlimited') || lower.includes('many')) complexity += 1;

    const basePrice = 250;
    const minPrice = basePrice + (complexity * 150);
    const maxPrice = minPrice + 200;
    const days = 2 + complexity;

    return {
      text: `**Estimated Quote:**

**Price Range:** $${minPrice} — $${maxPrice}
**Timeline:** ${days} — ${days + 3} business days
**Complexity:** ${complexity <= 2 ? 'Standard' : complexity <= 4 ? 'Advanced' : 'Complex'}

**Factors considered:**
• Deliverables requested
• Revision rounds
• Turnaround urgency
• Brand complexity

For an exact quote, I recommend a brief consultation. Would you like to book one?`,
      actions: [{ label: 'Book Consultation', value: 'book' }, { label: 'Compare Packages', value: 'compare' }]
    };
  }

  handleMarketing(message, lower, ctx) {
    if (!ctx.industry) {
      const industries = ['coffee', 'cafe', 'restaurant', 'tech', 'startup', 'fashion', 'clothing', 'gym', 'fitness', 'health', 'skincare', 'beauty', 'hotel', 'food'];
      for (const ind of industries) {
        if (lower.includes(ind)) { ctx.industry = ind; break; }
      }
    }

    const strategies = {
      coffee: ['Instagram story templates for daily specials', 'Loyalty card design', 'Menu board graphics', 'Coffee bag packaging labels', 'Storefront signage'],
      gym: ['Membership card design', 'Workout progress templates', 'Social media transformation posts', 'Apparel mockups (tanks, hoodies)', 'Referral program flyers'],
      tech: ['Website landing page hero', 'App store screenshots', 'Pitch deck template', 'Social proof graphics', 'Newsletter header design'],
      fashion: ['Lookbook layout template', 'Price tag design', 'Shopping bag graphics', 'Social media campaign kit', 'Email marketing templates'],
      health: ['Appointment card design', 'Social media wellness tips', 'Product label templates', 'Welcome packet design', 'Testimonial graphics']
    };

    const industry = ctx.industry || 'business';
    const recs = strategies[industry] || strategies.coffee;

    return {
      text: `**Marketing Strategy for ${industry.charAt(0).toUpperCase() + industry.slice(1)} Brands:**

Beyond your logo, I recommend these branded touchpoints:

${recs.map((r, i) => `${i + 1}. ${r}`).join('\n')}

These assets create a consistent brand experience across every customer interaction. Our Professional package includes most of these deliverables.

Would you like a custom marketing kit quote?`,
      actions: [{ label: 'Get Marketing Quote', value: 'quote' }, { label: 'See Packages', value: 'compare' }]
    };
  }

  handleTrend(message, lower, ctx) {
    let industry = null;
    for (const [key] of Object.entries(TRENDS)) {
      if (lower.includes(key)) { industry = key; break; }
    }

    if (!industry) {
      return {
        text: `**Current Design Trends by Industry:**

**Luxury:** ${TRENDS.luxury.join(' • ')}
**Tech:** ${TRENDS.tech.join(' • ')}
**Fashion:** ${TRENDS.fashion.join(' • ')}
**Food:** ${TRENDS.food.join(' • ')}
**Health:** ${TRENDS.health.join(' • ')}
**Fitness:** ${TRENDS.fitness.join(' • ')}

Which industry would you like me to dive deeper into?`,
        actions: []
      };
    }

    return {
      text: `**${industry.charAt(0).toUpperCase() + industry.slice(1)} Design Trends 2026:**

${TRENDS[industry].map((t, i) => `${i + 1}. **${t}**`).join('\n')}

These trends reflect where consumer attention is heading. The best brands adopt trends selectively — incorporating what's relevant while maintaining timeless core identity.

Want me to show how these trends could apply to your brand?`,
      actions: [{ label: 'Apply to My Brand', value: 'brand' }]
    };
  }

  // Utility: Get session summary for admin
  getSessionSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return {
      context: session.context,
      messageCount: session.history.length,
      lastActive: session.history[session.history.length - 1]?.time
    };
  }
}

module.exports = new ChatAgent();
