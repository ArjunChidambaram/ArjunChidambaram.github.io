import fs from 'fs';
import path from 'path';
import { NavItem, iconPaths, staticNavItems } from './navigation';

/**
 * Scans the pages directory to find dynamic page folders
 * Excludes special Next.js folders and files
 * SERVER-SIDE ONLY
 */
export function getDynamicPages(): NavItem[] {
  try {
    const pagesDir = path.join(process.cwd(), 'pages');
    
    if (!fs.existsSync(pagesDir)) {
      return [];
    }

    const items = fs.readdirSync(pagesDir, { withFileTypes: true });
    const dynamicPages: NavItem[] = [];

    // Folders to exclude from dynamic navigation
    const excludeFolders = ['api', 'blog', '_app', '_document', '404'];
    const excludeFiles = [
      'index.tsx', 'index.ts', 'index.js', 'index.jsx',
      '_app.tsx', '_app.ts', '_app.js', '_app.jsx',
      '_document.tsx', '_document.ts', '_document.js', '_document.jsx',
      '404.tsx', '404.ts', '404.js', '404.jsx',
      'sitemap.xml.ts'
    ];

    // Patterns to exclude from dynamic navigation (backup files, temp files, etc.)
    const excludePatterns = [
      /\.backup$/,
      /\.bak$/,
      /\.temp$/,
      /\.tmp$/,
      /~$/,
      /\.orig$/
    ];

    for (const item of items) {
      if (item.isDirectory() && !excludeFolders.includes(item.name)) {
        // Check if the folder has an index file or other content
        const folderPath = path.join(pagesDir, item.name);
        const folderContents = fs.readdirSync(folderPath);
        
        if (folderContents.length > 0) {
          // Check if there's an index file to make it a valid page
          const hasIndexFile = folderContents.some((file: string) => 
            file.startsWith('index.') && 
            (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx'))
          );

          if (hasIndexFile) {
            dynamicPages.push({
              url: `/${item.name}`,
              text: formatPageName(item.name),
              svgPath: iconPaths.default,
              isDynamic: true,
            });
          }
        }
      } else if (item.isFile() && !excludeFiles.includes(item.name)) {
        // Skip if it matches any exclude pattern
        const matchesPattern = excludePatterns.some(pattern => pattern.test(item.name));
        if (matchesPattern) {
          continue;
        }

        // Handle single page files (not index files)
        const fileName = item.name;
        const nameWithoutExt = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
        
        if (nameWithoutExt !== 'index') {
          dynamicPages.push({
            url: `/${nameWithoutExt}`,
            text: formatPageName(nameWithoutExt),
            svgPath: iconPaths.default,
            isDynamic: true,
          });
        }
      }
    }

    return dynamicPages;
  } catch (error) {
    console.error('Error scanning pages directory:', error);
    return [];
  }
}

/**
 * Formats a page name for display in navigation
 * Converts kebab-case or snake_case to Title Case
 */
function formatPageName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Combines static and dynamic navigation items
 * SERVER-SIDE ONLY
 */
export function getAllNavItems(): NavItem[] {
  const dynamicPages = getDynamicPages();
  return [...staticNavItems, ...dynamicPages];
}
