'use client';

import renderMathInElement from 'katex/contrib/auto-render';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';
import * as prod from 'react/jsx-runtime';
import rehype2react from 'rehype-react';
import rehypeSlug from 'rehype-slug';
import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';
import uniorg2rehype from 'uniorg-rehype';
import { CollapsedContext } from './CollapsedContext';

interface OrgPreviewProps {
  content: string;
  className?: string;
}

// Custom heading component that supports collapsing
function CollapsibleHeading({
  level,
  children,
  id,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  id?: string;
}) {
  const { collapsedHeadings, toggleHeading } = React.useContext(CollapsedContext);
  const isCollapsed = id ? collapsedHeadings.has(id) : false;
  const Tag = `h${level}` as const;

  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (id) {
      toggleHeading(id);
    }
  };

  return (
    <Tag
      id={id}
      className="group flex items-center gap-2 justify-between"
      data-heading-level={level}
    >
      <span className="flex-1">{children}</span>
      <button
        type="button"
        onClick={handleIconClick}
        className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer p-1"
        aria-label={isCollapsed ? '展開' : '折り畳み'}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
    </Tag>
  );
}

export function OrgPreview({ content, className }: OrgPreviewProps) {
  const [renderedContent, setRenderedContent] = React.useState<React.ReactElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { collapsedHeadings } = React.useContext(CollapsedContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Apply collapsed state to DOM elements
  React.useEffect(() => {
    if (!contentRef.current || !renderedContent) return;

    // Render math expressions using KaTeX
    renderMathInElement(contentRef.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\begin{equation}', right: '\\end{equation}', display: true },
        { left: '\\begin{equation*}', right: '\\end{equation*}', display: true },
        { left: '\\begin{align}', right: '\\end{align}', display: true },
        { left: '\\begin{align*}', right: '\\end{align*}', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      strict: false,
    });

    const headings = contentRef.current.querySelectorAll('[data-heading-level]');

    for (const heading of Array.from(headings)) {
      const headingElement = heading as HTMLElement;
      const headingId = headingElement.id;
      const headingLevel = Number.parseInt(headingElement.dataset.headingLevel || '1', 10);

      if (!headingId) continue;

      const isCollapsed = collapsedHeadings.has(headingId);

      // Find all siblings until next heading of same or higher level
      let nextElement = headingElement.nextElementSibling;
      const elementsToHide: Element[] = [];

      while (nextElement) {
        // Check if it's a heading
        const nextHeadingLevel = nextElement.hasAttribute('data-heading-level')
          ? Number.parseInt((nextElement as HTMLElement).dataset.headingLevel || '999', 10)
          : null;

        // Stop if we hit a heading of same or higher level (lower number)
        if (nextHeadingLevel !== null && nextHeadingLevel <= headingLevel) {
          break;
        }

        elementsToHide.push(nextElement);
        nextElement = nextElement.nextElementSibling;
      }

      // Apply display style
      for (const element of elementsToHide) {
        (element as HTMLElement).style.display = isCollapsed ? 'none' : '';
      }
    }
  }, [collapsedHeadings, renderedContent]);

  React.useEffect(() => {
    const parseOrgContent = async () => {
      try {
        const components = {
          h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={1} {...props} />
          ),
          h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={2} {...props} />
          ),
          h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={3} {...props} />
          ),
          h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={4} {...props} />
          ),
          h5: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={5} {...props} />
          ),
          h6: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <CollapsibleHeading level={6} {...props} />
          ),
        };

        const result = await unified()
          .use(uniorgParse)
          .use(uniorg2rehype)
          .use(rehypeSlug) // Add IDs to headings
          .use(rehype2react, { ...prod, components })
          .process(content);

        setRenderedContent(result.result as React.ReactElement);
        setError(null);
      } catch (err) {
        console.error('Failed to parse org content:', err);
        setError('Failed to parse org-mode content');
      }
    };

    parseOrgContent();
  }, [content]);

  if (error) {
    return (
      <div className={className}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!renderedContent) {
    return (
      <div className={className}>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      className={`prose prose-slate max-w-none dark:prose-invert ${className || ''}`}
      style={{
        lineHeight: '1.75',
      }}
    >
      {renderedContent}
    </div>
  );
}
