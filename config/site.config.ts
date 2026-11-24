/**
 * Site Configuration File
 * 
 * This file contains all the personal information, social links, and site metadata
 * that is used throughout the application. Update this file to change any personal
 * information across the entire site.
 */

export const SITE_URL = "https://arjunchidambaram.github.io";

export const siteConfig = {
  // Personal Information
  personalInfo: {
    fullName: "Arjun Chidambaram Subbiah",
    shortName: "Arjun Subbiah", 
    brandName: "ArjunChidambaram",
    jobTitle: "Staff Data Scientist",
    experience: "9+ years",
    expertise: "experimentation, causal inference and applied AI",
    
    // Bio/Description
    shortBio: "Arjun Chidambaram Subbiah is a Staff Data Scientist at Walmart with 9+ years of experience in A/B testing at 50M+ visitor scale, causal inference, data pipelines and applied LLM systems.",
    
    // Location & Contact
    email: "Arjunchidambaram1991@gmail.com",
    location: "San Jose, CA",
  },

  // Hero Section Content
  heroSection: {
    greeting: "Hi my name is",
    backgroundText: "EXPERIMENTS CAUSAL INFERENCE APPLIED AI DATA SCIENCE",
    // Cycled by the typing animation under the job title
    roles: ["A/B testing at scale", "Causal inference", "Multi-agent LLM systems", "Data pipelines", "Computer vision"],
    heroDescription: [
      "I turn ambiguous, high-stakes product questions into evidence a team can act on: controlled experiments at 50M+ visitor scale, the causal-inference tooling behind them, and applied AI systems that stress-test the analysis before it reaches an executive.",
      "9+ years, two promotions at Walmart across store fulfillment, last-mile delivery and eCommerce.",
    ],
    ctaText: "Contact me!",
    secondaryCtaText: "See my work",
    scrollText: "Scroll",
  },

  // About Section Content
  aboutSection: {
    title: "Who am I?",
    myJourney: {
      title: "My Journey",
      paragraphs: [
        "I'm a Staff Data Scientist at Walmart, where I'm the analytic lead for the Item Page, the product page every shopper lands on. I own the ship/no-ship calls for its experiments: personalization, image gallery, shop modules, pricing and delivery messaging.",
        "Before that I measured last-mile delivery and in-store picking, and started out in pharma commercial analytics for Novartis. Along the way I've built the tools behind the analysis: control-group selection, alerting, a production Dash app on Kubernetes, and a YOLO model that checks 2M+ orders a day.",
        "Lately I build applied AI: a multi-agent LLM pipeline that red-teams high-stakes models before they reach leadership, and LangGraph agents that automate UI research. I care about honest numbers. If the result is a null, I report it as one."
      ]
    },
    experience: [
      {
        title: "Staff Data Scientist",
        company: "Walmart · eCommerce Item Page",
        period: "2024 - Present",
        description: "Analytic lead for the Item Page experiment portfolio. Built an 8-agent LLM model red-team and shipped a Dash/Plotly governance app to Kubernetes."
      },
      {
        title: "Senior Data Scientist",
        company: "Walmart · Last-Mile Delivery",
        period: "2021 - 2024",
        description: "Owned delivery measurement: reusable diff-in-diff control tooling, 99.88%-accurate alerting, and a YOLO bag-compliance model scoring 2M+ orders a day."
      },
      {
        title: "Data Scientist",
        company: "Walmart · Store Fulfillment",
        period: "2019 - 2021",
        description: "Fixed a nil-pick rules engine with a store-level experiment, and showed 96% of successful substitutes sit in the same aisle."
      },
      {
        title: "Data Analyst",
        company: "KMK Consulting · Novartis",
        period: "Jan 2017 - Jul 2019",
        description: "Market sizing, segmentation and SARIMA forecasting. Automated a Tableau pipeline from two person-days to four hours."
      }
    ],
    education: [
      {
        degree: "Master of Science in Industrial Engineering",
        school: "Lehigh University, Bethlehem, PA",
        period: "Aug 2015 – May 2017",
        description: "GPA 3.63 · Operations research, statistics and optimization"
      },
      {
        degree: "Bachelor of Engineering in Mechanical Engineering",
        school: "PSG College of Technology, Coimbatore, India",
        period: "Jun 2009 – May 2014",
        description: "GPA 3.5"
      }
    ],
    skills: [
      "A/B Testing", "Causal Inference", "Difference-in-Differences", "Power & MDE Analysis",
      "Python", "SQL", "BigQuery", "Spark", "Hive", "LangGraph", "Multi-agent LLMs", "Ollama",
      "Playwright", "Dash / Plotly", "Tableau", "Docker", "Kubernetes", "YOLO", "SARIMA Forecasting"
    ]
  },

  // Selected Work Section
  workSection: {
    title: "Selected Work",
    description: "A few things I've built and measured. Numbers are rounded; the details stay inside Walmart.",
    stats: [
      { value: 50, suffix: "M+", label: "visitors in a single experiment" },
      { value: 2, suffix: "M+", label: "orders scored daily by my CV model" },
      { value: 4, suffix: "B+", label: "order lines in one pipeline" },
      { value: 99.88, suffix: "%", decimals: 2, label: "backtested alert accuracy" },
    ],
    projects: [
      {
        title: "AI red team for high-stakes models",
        tag: "Multi-agent LLMs",
        emoji: "🛡️",
        body: "An 8-agent, LLM-orchestrated critique pipeline that stress-tests analyses before an executive readout. Its first run found six structural flaws in a sizing model and forced a rebuild.",
        tech: ["LLM agents", "Python", "Prompt design"],
      },
      {
        title: "Item Page experimentation program",
        tag: "Experimentation",
        emoji: "🧪",
        body: "Owned ship/no-ship decisions across an 11-month test portfolio. The flagship test ran on 50M+ visitors and 100M+ sessions, with revenue reported honestly as a null.",
        tech: ["A/B testing", "BigQuery", "Guardrails"],
      },
      {
        title: "Catalog governance app",
        tag: "Production app",
        emoji: "📊",
        body: "Built solo and deployed to Walmart's Kubernetes platform: a Dash/Plotly app over a pipeline that turns 4B+ order lines into a 43M-row scorecard mart.",
        tech: ["Dash/Plotly", "Docker", "Kubernetes"],
      },
      {
        title: "LLM agents for UI research",
        tag: "Agents",
        emoji: "🤖",
        body: "LangGraph agents on local Ollama models driving Playwright and Appium to capture first-party app and web evidence at scale for instrumentation validation.",
        tech: ["LangGraph", "Ollama", "Playwright"],
      },
      {
        title: "Delivery bag compliance model",
        tag: "Computer vision",
        emoji: "📦",
        body: "A YOLO object-detection model, trained with transfer learning when labeled imagery didn't exist, that flags missing or non-compliant bags on 2M+ orders a day.",
        tech: ["YOLO", "Transfer learning", "Batch scoring"],
      },
      {
        title: "Control-group selection toolkit",
        tag: "Causal inference",
        emoji: "🎯",
        body: "Automated feature sweeps, clustering and difference-in-differences validation, then used it in a parallel-trends-validated zone experiment that replaced a static system.",
        tech: ["Diff-in-diff", "Clustering", "Python"],
      },
    ],
  },

  // Blog Section Content
  blogSection: {
    title: "Latest Blog Posts",
    description: "I share insights about data science, machine learning, and AI based on my experience building production-scale systems. Here are some of my recent blog posts."
  },

  // Contact Section Content
  contactSection: {
    title: "Let's work together!",
    subtitle: "Contact",
    description: "Open to conversations about staff and principal data science roles, experimentation, and applied AI. The fastest way to reach me is email.",
    form: {
      namePlaceholder: "Your Name",
      emailPlaceholder: "Your Email",
      messagePlaceholder: "Tell me about your project or just say hello!",
      submitText: "Send Message"
    }
  },

  // Site Metadata
  siteMetadata: {
    title: "Arjun Chidambaram Subbiah - Staff Data Scientist",
    description: "Staff Data Scientist at Walmart. Experimentation at 50M+ visitor scale, causal inference, data pipelines and applied LLM systems. Based in San Jose, CA.",
    siteUrl: "https://arjunchidambaram.github.io",
    siteName: "Arjun Chidambaram Subbiah",
    imageAlt: "Arjun Chidambaram Subbiah portfolio website",
    keywords: ["Arjun Chidambaram Subbiah", "Arjun Subbiah", "Staff Data Scientist", "Walmart", "A/B testing", "causal inference", "experimentation", "LLM agents", "LangGraph", "San Jose"],
  },

  // Social Media Links
  socialLinks: {
    github: {
      url: "https://github.com/ArjunChidambaram",
      username: "ArjunChidambaram",
      title: "Arjun Chidambaram Subbiah's Github Profile",
    },
    linkedin: {
      url: "https://www.linkedin.com/in/arjun-subbiah-b19330a6/",
      title: "Arjun Chidambaram Subbiah's LinkedIn Profile",
    },
  },

  // Blog Configuration
  blog: {
    postsPerPage: 10,
    defaultTopics: ["All", "Machine Learning", "Statistics", "Data Science", "AI", "Python"],
    featuredTopics: ["Machine Learning", "AI", "Data Science"],
  },

  // Analytics & Tracking
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
  },

  // Image Paths
  images: {
    // Main Open Graph image
    ogImage: "/og-image.png",
    
    // Hero section illustration
    heroIllustration: "/laptop-illustration.webp",
    
    // Profile/avatar images
    profile: "/laptop-illustration.webp", // Update this to your actual profile image
    
    // Favicon paths
    favicons: {
      appleTouchIcon: "/favicons/apple-touch-icon.png?v=3",
      favicon32: "/favicons/favicon-32x32.png?v=3", 
      favicon16: "/favicons/favicon-16x16.png?v=3",
      safariPinnedTab: "/favicons/safari-pinned-tab.svg?v=3",
      manifest: "/favicons/site.webmanifest?v=3",
    },
    
    // Background decorative images
    decorative: {
      dots: "/extra/dots.svg",
      dotsDark: "/extra/dots-dark.svg", 
      arrow: "/extra/arrow.svg",
    },
  },

  // Theme Configuration
  theme: {
    defaultTheme: "light",
    supportedThemes: ["light", "dark"],
  },
} as const;

// Type exports for TypeScript support
export type SiteConfig = typeof siteConfig;
export type PersonalInfo = typeof siteConfig.personalInfo;
export type SocialLinks = typeof siteConfig.socialLinks;
export type BlogConfig = typeof siteConfig.blog;
export type ImagePaths = typeof siteConfig.images;
