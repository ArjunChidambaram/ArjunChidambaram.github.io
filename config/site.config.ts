/**
 * Site Configuration File
 * 
 * This file contains all the personal information, social links, and site metadata
 * that is used throughout the application. Update this file to change any personal
 * information across the entire site.
 */

export const siteConfig = {
  // Personal Information
  personalInfo: {
    fullName: "Arjun Chidambaram Subbiah",
    shortName: "Arjun Subbiah", 
    brandName: "ArjunChidambaram",
    jobTitle: "Staff Data Scientist",
    experience: "8+ years",
    expertise: "ML, AI, and Data Science",
    
    // Bio/Description
    shortBio: "Arjun Chidambaram Subbiah is a Staff Data Scientist with 8+ years of experience leading high-impact ML initiatives. Expert in production-scale AI systems, computer vision, and delivering measurable business value.",
    
    // Location & Contact
    email: "arjun.subbiah@example.com", // Update with actual email
    location: "United States", // Update with actual location
  },

  // Hero Section Content
  heroSection: {
    greeting: "Hi my name is",
    backgroundText: "DATA SCIENTIST MACHINE LEARNING AI COMPUTER VISION STAFF",
    heroDescription: [
      "Staff Data Scientist with 8+ years of experience leading high-impact machine learning initiatives that drive strategic business outcomes.",
      "Expert in developing production-scale AI systems, optimizing complex operational processes, and delivering measurable value through advanced analytics. Specialized in computer vision, optimization algorithms, and causal inference with $40M+ in documented business impact."
    ],
    ctaText: "Contact me!",
    scrollText: "Scroll",
  },

  // About Section Content
  aboutSection: {
    title: "Who am I?",
    myJourney: {
      title: "My Journey",
      paragraphs: [
        "With over 8 years in the data science field, I've had the privilege of working across various industries, from retail to fintech, solving complex problems with data-driven approaches. My tenure at Walmart has been particularly impactful, where I've led the design and deployment of enterprise-scale computer vision solutions.",
        "My expertise spans the entire data science lifecycle - from data collection and preprocessing to model deployment and monitoring. I'm particularly passionate about making machine learning accessible and interpretable for business stakeholders, ensuring AI solutions deliver tangible business value.",
        "When I'm not diving deep into datasets, you'll find me contributing to open-source projects, mentoring aspiring data scientists, or exploring the latest advancements in AI research. I believe in the power of community and knowledge sharing to advance our field."
      ]
    },
    experience: [
      {
        title: "Staff Data Scientist",
        company: "Walmart",
        period: "Jan 2022 - Present",
        description: "Led AI Strategy & Implementation: Architected enterprise-scale computer vision solutions generating $30M in annual cost savings"
      },
      {
        title: "Senior Data Scientist",
        company: "Walmart",
        period: "Aug 2019 - Dec 2021",
        description: "Developed K-Means clustering models identifying fraudulent activity, reducing delivery costs by 10%"
      },
      {
        title: "Data Analyst",
        company: "KMK Consulting Inc.",
        period: "Jan 2017 - Jul 2019",
        description: "Engineered scalable ETL pipelines using Python and Apache Airflow, reducing manual intervention by 90%"
      }
    ],
    education: [
      {
        degree: "Master of Science in Industrial Engineering",
        school: "Lehigh University, Bethlehem, PA",
        period: "Aug 2015 – May 2017",
        description: "GPA: 3.63 | Focus on Operations Research and Machine Learning | Research in Optimization Algorithms and Data Analytics"
      },
      {
        degree: "Bachelor of Engineering in Mechanical Engineering",
        school: "PSG College of Technology, Coimbatore, India",
        period: "Jun 2009 – May 2014",
        description: "GPA: 3.5 | Focus on Engineering Mathematics and Systems Design | Foundation in Technical Problem Solving"
      }
    ],
    skills: [
      "Python", "PySpark", "SQL", "TensorFlow", "PyTorch", "Computer Vision",
      "YOLO", "CNN", "MLOps", "Google Cloud Platform", "Apache Airflow", "Tableau",
      "A/B Testing", "Causal Inference", "Statistical Modeling", "Operations Research", "Docker"
    ]
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
    description: "Whether you have a project in mind, need consultation on data science strategy, or just want to discuss the latest in AI, I'd love to hear from you.",
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
    description: "Personal blog and portfolio of Arjun Subbiah - Staff Data Scientist specializing in ML, AI, and Data Science.",
    siteUrl: "https://ArjunChidambaram.github.io", // Update with actual domain
    siteName: "Arjun Chidambaram Subbiah",
    imageAlt: "Arjun Chidambaram Subbiah portfolio website",
    keywords: ["Data Science", "Machine Learning", "AI", "Python", "Statistics", "Computer Vision"],
  },

  // Social Media Links
  socialLinks: {
    github: {
      url: "https://github.com/arjunsubbiah",
      username: "arjunsubbiah",
      title: "Arjun Chidambaram Subbiah's Github Profile",
    },
    linkedin: {
      url: "https://linkedin.com/in/arjun-subbiah-b19330a6/",
      title: "Arjun Chidambaram Subbiah's LinkedIn Profile",
    },
    twitter: {
      url: "https://twitter.com/arjunsubbiah",
      username: "arjunsubbiah", 
      title: "Follow Arjun Chidambaram Subbiah on Twitter",
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
    ogImage: "/arjun-subbiah-og.png",
    
    // Hero section illustration
    heroIllustration: "/laptop-illustration.webp",
    
    // Profile/avatar images
    profile: "/laptop-illustration.webp", // Update this to your actual profile image
    
    // Favicon paths
    favicons: {
      appleTouchIcon: "/favicons/apple-touch-icon.png",
      favicon32: "/favicons/favicon-32x32.png", 
      favicon16: "/favicons/favicon-16x16.png",
      safariPinnedTab: "/favicons/safari-pinned-tab.svg",
      manifest: "/favicons/site.webmanifest",
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
    defaultTheme: "dark",
    supportedThemes: ["light", "dark"],
  },
} as const;

// Type exports for TypeScript support
export type SiteConfig = typeof siteConfig;
export type PersonalInfo = typeof siteConfig.personalInfo;
export type SocialLinks = typeof siteConfig.socialLinks;
export type BlogConfig = typeof siteConfig.blog;
export type ImagePaths = typeof siteConfig.images;
