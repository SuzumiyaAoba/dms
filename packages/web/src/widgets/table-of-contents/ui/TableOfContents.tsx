'use client';

import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCollapsedContext } from '@/entities/document/ui/CollapsedContext';

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
  const { collapsedHeadings, toggleHeading } = useCollapsedContext();

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

  const handleClick = (id: string, e: React.MouseEvent) => {
    // If clicking on the chevron area (left side), toggle collapse
    const target = e.target as HTMLElement;
    if (target.closest('.toggle-icon')) {
      e.stopPropagation();
      toggleHeading(id);
      return;
    }

    // Otherwise, scroll to the heading
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter out headings that are children of collapsed headings
  const visibleHeadings = headings.filter((heading) => {
    // Check if any parent heading is collapsed
    for (let i = headings.indexOf(heading) - 1; i >= 0; i--) {
      const potentialParent = headings[i];
      if (potentialParent.level < heading.level) {
        // This is a parent heading
        if (collapsedHeadings.has(potentialParent.id)) {
          return false; // Hide this heading
        }
        break; // Found the immediate parent, no need to check further
      }
    }
    return true;
  });

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
            {visibleHeadings.map((heading) => {
              const isHeadingCollapsed = collapsedHeadings.has(heading.id);
              const indentation = (heading.level - 1) * 12; // px
              // Check if this heading has children
              const hasChildren = headings.some(
                (h) =>
                  headings.indexOf(h) > headings.indexOf(heading) &&
                  h.level > heading.level &&
                  (headings.indexOf(h) === headings.indexOf(heading) + 1 ||
                    headings
                      .slice(headings.indexOf(heading) + 1, headings.indexOf(h))
                      .every((between) => between.level > heading.level)),
              );

              return (
                <button
                  key={heading.id}
                  type="button"
                  onClick={(e) => handleClick(heading.id, e)}
                  className={`relative flex items-center gap-1 w-full text-left text-sm transition-colors hover:text-foreground ${
                    activeId === heading.id
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                  style={{
                    paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                  }}
                >
                  {heading.level > 1 && (
                    <span
                      className="absolute top-1 bottom-1 w-px bg-border opacity-70 pointer-events-none"
                      style={{
                        left: `${indentation - 8}px`,
                      }}
                      aria-hidden
                    />
                  )}
                  {hasChildren && (
                    <span className="toggle-icon flex-shrink-0">
                      {isHeadingCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                  <span className={hasChildren ? '' : 'ml-4'}>{heading.text}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
