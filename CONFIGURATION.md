# Site Configuration Guide

## Overview

All personal information, social links, and site metadata are now centralized in the `config/site.config.ts` file. This makes it easy to update any information across the entire site from a single location.

## Configuration File Location

**File:** `config/site.config.ts`

## How to Update Site Information

### Personal Information
Update these fields in `siteConfig.personalInfo`:

```typescript
personalInfo: {
  fullName: "Your Full Name",           // Used in titles, meta tags, footer
  shortName: "Your Short Name",         // Used in blog headers  
  brandName: "YourBrandName",          // Used in header logo (no spaces)
  jobTitle: "Your Job Title",          // e.g., "Staff Data Scientist"
  experience: "X+ years",              // e.g., "8+ years"
  expertise: "Your Expertise",         // e.g., "ML, AI, and Data Science"
  shortBio: "Your bio description...", // Used in meta descriptions
  email: "your.email@example.com",     // Update with actual email
  location: "Your Location",           // Update with actual location
}
```

### Site Metadata
Update these fields in `siteConfig.siteMetadata`:

```typescript
siteMetadata: {
  title: "Your Name - Your Title",     // Main site title
  description: "Your site description", // Meta description
  siteUrl: "https://yoursite.com",     // Your actual domain
  siteName: "Your Site Name",          // Open Graph site name
  imageAlt: "Alt text for your site", // Image alt text
  keywords: ["keyword1", "keyword2"],  // SEO keywords
}
```

### Social Media Links
Update these fields in `siteConfig.socialLinks`:

```typescript
socialLinks: {
  github: {
    url: "https://github.com/yourusername",
    username: "yourusername",
    title: "Your Name's Github Profile",
  },
  linkedin: {
    url: "https://linkedin.com/in/your-profile/",
    title: "Your Name's LinkedIn Profile",
  },
  twitter: {
    url: "https://twitter.com/yourusername",
    username: "yourusername", 
    title: "Follow Your Name on Twitter",
  },
}
```

### Hero Section Content
Update these fields in `siteConfig.heroSection`:

```typescript
heroSection: {
  greeting: "Hi my name is",                    // Greeting text
  backgroundText: "YOUR KEYWORDS HERE",        // Background text behind content
  heroDescription: [                           // Array of description paragraphs
    "Your first paragraph about yourself...",
    "Your second paragraph with more details..."
  ],
  ctaText: "Contact me!",                      // Call-to-action button text
  scrollText: "Scroll",                       // Scroll indicator text
}
```

### About Section Content
Update these fields in `siteConfig.aboutSection`:

```typescript
aboutSection: {
  title: "Who am I?",                         // Section title
  myJourney: {
    title: "My Journey",                      // Journey subsection title
    paragraphs: [                            // Array of journey paragraphs
      "Your journey paragraph 1...",
      "Your journey paragraph 2...",
      "Your journey paragraph 3..."
    ]
  },
  experience: [                              // Array of work experience
    {
      title: "Your Job Title",
      company: "Company Name",
      period: "Start - End",
      description: "What you accomplished..."
    }
  ],
  education: [                               // Array of education entries
    {
      degree: "Your Degree",
      school: "Your School", 
      period: "Start - End",
      description: "What you studied..."
    }
  ],
  skills: ["Skill1", "Skill2", "Skill3"]    // Array of skills
}
```

### Blog Section Content
Update these fields in `siteConfig.blogSection`:

```typescript
blogSection: {
  title: "Latest Blog Posts",                // Section title  
  description: "Your blog description..."    // Description text under title
}
```

### Contact Section Content
Update these fields in `siteConfig.contactSection`:

```typescript
contactSection: {
  title: "Let's work together!",             // Main title
  subtitle: "Contact",                       // Subtitle
  description: "Your contact description...", // Description paragraph
  form: {                                    // Contact form placeholders
    namePlaceholder: "Your Name",
    emailPlaceholder: "Your Email", 
    messagePlaceholder: "Tell me about your project...",
    submitText: "Send Message"
  }
}
```

### Blog Configuration
Update these fields in `siteConfig.blog`:

```typescript
blog: {
  postsPerPage: 10,                    // Number of posts per page
  defaultTopics: [                     // Available blog topics/categories
    "All", 
    "Machine Learning", 
    "Statistics", 
    "Data Science", 
    "AI", 
    "Python"
  ],
  featuredTopics: [                    // Featured topics for homepage
    "Machine Learning", 
    "AI", 
    "Data Science"
  ],
}
```

### Image Paths Configuration
Update these fields in `siteConfig.images`:

```typescript
images: {
  // Main Open Graph image (used for social media sharing)
  ogImage: "/your-og-image.png",
  
  // Hero section illustration
  heroIllustration: "/your-hero-image.webp",
  
  // Profile/avatar images
  profile: "/your-profile.webp",
  
  // Favicon paths (update with your own favicons)
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
}
```

## Files That Use the Configuration

The following files automatically pull information from the config file:

### Core Components
- `components/Footer.tsx` - Author name and social links
- `components/Header.tsx` - Brand name in navigation
- `components/AppHead.tsx` - Site metadata, OG images, and personal info
- `pages/index.tsx` - Site metadata and personal info
- `pages/blog/index.tsx` - Blog page titles
- `pages/_document.tsx` - Favicon paths

### Sections
- `sections/HeroSection.tsx` - **All hero content from config** (greeting, background text, descriptions, CTA)
- `sections/BlogSection.tsx` - **Blog section content from config** (title, description)
- `sections/AboutSection.tsx` - **All about content from config** (title, journey, experience, education, skills)
- `sections/ContactSection.tsx` - Contact content (can be enhanced with config)
- `sections/BlogHeroSection.tsx` - Blog intro text and social links
- `components/AboutBgSvg.tsx` - Decorative image paths (imported but can be enhanced)
- `context/filter.tsx` - Blog topic filtering options

### Content Areas Now Configurable
- ✅ **Hero Section**: Greeting, name, job title, descriptions, CTA button
- ✅ **Background Text**: Large background text behind hero content
- ✅ **About Section**: Journey paragraphs, experience entries, education, skills
- ✅ **Blog Section**: Title and description text
- ✅ **Personal Information**: All names, titles, experience, bio
- ✅ **Social Links**: All social media URLs and titles
- ✅ **Meta Information**: SEO titles, descriptions, OG images
- ✅ **Images**: All image paths and favicon references

### Image Usage
- **Open Graph Images**: Used in social media sharing previews
- **Hero Images**: Main illustration on homepage
- **Favicons**: Browser tab icons and mobile app icons
- **Decorative Images**: Background SVGs and design elements

## Benefits of Centralized Configuration

1. **Single Source of Truth**: All personal info and image paths in one place
2. **Consistent Updates**: Change once, updates everywhere
3. **Type Safety**: TypeScript ensures all references are valid
4. **Easy Maintenance**: No need to search through multiple files
5. **No Breaking Changes**: Centralized updates prevent inconsistencies
6. **Easy Image Management**: All image paths organized and documented
7. **SEO Friendly**: Consistent metadata across all pages

## Making Changes

1. **Edit the config file**: Update `config/site.config.ts` with your information
2. **Save the file**: The development server will automatically reload
3. **Test your changes**: Check that all pages display correctly
4. **Deploy**: Your changes will be reflected across the entire site

## Important Notes

- Always use the exact field names as defined in the config
- The `brandName` should not contain spaces (used in URLs and code)
- Make sure social media URLs are complete and valid
- Blog topics should match the categories used in your blog posts
- Test the site after making changes to ensure everything works

## Example Update Process

To change your name from "Arjun Chidambaram Subbiah" to "Your Name":

1. Open `config/site.config.ts`
2. Update `personalInfo.fullName` to "Your Name"
3. Update `personalInfo.shortName` to "Your Name" (or nickname)
4. Update `personalInfo.brandName` to "YourName" (no spaces)
5. Save the file
6. Check the homepage, blog page, header, and footer for updates

That's it! Your name will be updated throughout the entire site automatically.

## Updating Images

### Adding Your Own Images

1. **Open Graph Image**: Replace `/public/arjun-subbiah-og.png` with your own OG image
   - Recommended size: 1200x630px
   - Update `siteConfig.images.ogImage` to point to your new file

2. **Profile Picture**: Replace `/public/arjun.webp` with your own profile image
   - Update `siteConfig.images.profile` path accordingly

3. **Hero Illustration**: Replace `/public/laptop-illustration.webp` with your own
   - Update `siteConfig.images.heroIllustration` path

4. **Favicons**: Generate new favicons using tools like [favicon.io](https://favicon.io)
   - Replace files in `/public/favicons/` directory
   - Update paths in `siteConfig.images.favicons` if needed

### Image Best Practices

- **Use WebP format** for better compression and performance
- **Optimize images** before adding to reduce file size
- **Keep consistent naming** conventions
- **Update config paths** after adding new images
- **Test on different devices** to ensure proper display

### Example: Replacing the OG Image

1. Add your new image: `/public/my-awesome-og.png`
2. Update config: `ogImage: "/my-awesome-og.png"`
3. Save the file - automatic update across all social sharing!
