# Dynamic Navigation System

This blog project now includes a dynamic navigation system that automatically creates navigation links for new pages you add to the `pages` directory.

## How It Works

### Automatic Page Detection
When you add a new folder with content in the `pages` directory, the system will automatically:
1. Detect the new folder
2. Check if it has an `index.tsx` file 
3. Add a navigation link to the header
4. Format the folder name for display (e.g., `my-projects` becomes "My Projects")

### Files and Structure

#### Core Files
- `utils/navigation.ts` - Client-side navigation types and static navigation items
- `utils/navigation.server.ts` - Server-side file system scanning logic  
- `hooks/useNavigation.ts` - React hook for fetching navigation data
- `pages/api/navigation.ts` - API endpoint that serves navigation data
- `components/Header.tsx` - Updated header component that uses dynamic navigation

#### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Header.tsx    │◄───│ useNavigation.ts │◄───│ /api/navigation │
│   (Client)      │    │    (Hook)        │    │   (Server API)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ navigation.     │
                                               │ server.ts       │
                                               │ (File Scanner)  │
                                               └─────────────────┘
```

## Adding New Sections

### Method 1: Folder Structure (Recommended)
1. Create a new folder in the `pages` directory:
   ```
   pages/
   ├── my-new-section/
   │   └── index.tsx
   ```

2. The `index.tsx` file should export a React component:
   ```tsx
   import type { NextPage } from "next";
   import Head from "next/head";
   import Header from "@/components/Header";
   import Footer from "@/components/Footer";
   
   const MyNewSection: NextPage = () => {
     return (
       <>
         <Head>
           <title>My New Section</title>
         </Head>
         <div className="bg-bglight dark:bg-bgdark min-h-screen">
           <Header />
           <main className="pt-20 px-4 sm:px-8">
             {/* Your content here */}
           </main>
           <Footer />
         </div>
       </>
     );
   };
   
   export default MyNewSection;
   ```

3. The navigation will automatically update and include your new section!

### Method 2: Single File
1. Create a single `.tsx` file in the `pages` directory:
   ```
   pages/
   ├── my-page.tsx
   ```

2. Export your React component from this file

### Excluded Items
The system automatically excludes certain folders and files:
- `api/` - API routes
- `blog/` - Blog pages (handled separately)
- `_app.tsx`, `_document.tsx` - Next.js special files
- `404.tsx` - Error pages
- `index.tsx` - Homepage

## Examples

The following example pages have been created to demonstrate the system:

### 1. Projects Page (`/projects`)
- Location: `pages/projects/index.tsx`
- Shows a grid of project cards
- Demonstrates folder-based page structure

### 2. Portfolio Page (`/portfolio`)  
- Location: `pages/portfolio/index.tsx`
- Professional portfolio layout
- Includes skills, experience, and achievements

### 3. About Page (`/about`)
- Location: `pages/about.tsx`
- Single file page structure
- Personal information and background

## Navigation Behavior

### Static Navigation Items
These remain fixed in the navigation:
- "Who am i?" - Links to `#whoami` section on homepage
- "Blog" - Links to `#blog` section on homepage  
- "Contact" - Links to `#contact` section on homepage

### Dynamic Navigation Items
- Automatically generated from `pages` directory
- Use Next.js `Link` component for client-side routing
- Display with default document icon
- Formatted names (kebab-case → Title Case)

## Customization

### Custom Icons
To add custom icons for specific pages, modify the `iconPaths` object in `utils/navigation.ts`:

```ts
export const iconPaths = {
  // ... existing icons
  'my-section': "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
};
```

### Excluding Pages
To exclude additional pages from navigation, modify the `excludeFolders` or `excludeFiles` arrays in `utils/navigation.server.ts`.

## Development Notes

- The file system scanning happens on the server-side only
- Navigation data is fetched via API call on the client-side
- Changes to the `pages` directory require a browser refresh to see updated navigation
- The system is optimized for development workflow and automatic updates

## Troubleshooting

### Navigation Not Updating
1. Check that your page has an `index.tsx` file (for folders)
2. Ensure the file exports a default React component
3. Refresh the browser to fetch updated navigation data
4. Check the browser console for any JavaScript errors

### Page Not Accessible
1. Verify the file structure matches Next.js conventions
2. Check that the component is properly exported
3. Ensure there are no TypeScript compilation errors
