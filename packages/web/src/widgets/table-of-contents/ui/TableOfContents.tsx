'use client';

import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

/**
 * Clean org-mode syntax from text
 * - Remove org-mode links: [[url][description]] -> description
 * - Remove bold/italic markers: *text*, /text/, _text_ -> text
 */
function cleanOrgText(text: string): string {
  let cleaned = text;

  // Replace org-mode links [[url][description]] with just description
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, '$2');

  // Replace org-mode links [[url]] with just url
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Remove bold markers
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');

  // Remove italic markers
  cleaned = cleaned.replace(/\/([^/]+)\//g, '$1');

  // Remove underline markers
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // Remove strikethrough markers
  cleaned = cleaned.replace(/\+([^+]+)\+/g, '$1');

  // Remove code markers
  cleaned = cleaned.replace(/~([^~]+)~/g, '$1');
  cleaned = cleaned.replace(/=([^=]+)=/g, '$1');

  return cleaned.trim();
}

/**
 * Extract headings from org-mode or markdown content
 */
function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  const idCounts = new Map<string, number>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Org-mode heading: * Heading, ** Heading, etc.
    const orgMatch = line.match(/^(\*+)\s+(.+)$/);
    if (orgMatch) {
      const level = orgMatch[1].length;
      const rawText = orgMatch[2].trim();
      const text = cleanOrgText(rawText);
      let baseId = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      // Handle empty IDs
      if (!baseId) {
        baseId = `heading-${lineIndex}`;
      }

      // Make ID unique by appending a counter if needed
      const count = idCounts.get(baseId) || 0;
      const id = count > 0 ? `${baseId}-${count}` : baseId;
      idCounts.set(baseId, count + 1);

      headings.push({ id, text, level });
      continue;
    }

    // Markdown heading: # Heading, ## Heading, etc.
    const mdMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (mdMatch) {
      const level = mdMatch[1].length;
      const rawText = mdMatch[2].trim();
      const text = cleanOrgText(rawText);
      let baseId = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      // Handle empty IDs
      if (!baseId) {
        baseId = `heading-${lineIndex}`;
      }

      // Make ID unique by appending a counter if needed
      const count = idCounts.get(baseId) || 0;
      const id = count > 0 ? `${baseId}-${count}` : baseId;
      idCounts.set(baseId, count + 1);

      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    // Scroll spy: highlight active heading based on scroll position
    const handleScroll = () => {
      const headingElements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null);

      let currentId = '';
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = el.id;
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="sticky top-6">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground hover:opacity-70 transition-opacity w-full"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <List className="h-4 w-4" />
          <span>目次</span>
        </button>
        {!isCollapsed && (
          <nav className="space-y-1">
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                onClick={() => handleClick(heading.id)}
                className={`block w-full text-left text-sm transition-colors hover:text-foreground ${
                  activeId === heading.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
                style={{
                  paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                }}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
