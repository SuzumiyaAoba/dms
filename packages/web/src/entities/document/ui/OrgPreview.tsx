'use client';

import toml from '@iarna/toml';
import yaml from 'js-yaml';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';
import * as prod from 'react/jsx-runtime';
import rehype2react from 'rehype-react';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';
import uniorg2rehype from 'uniorg-rehype';
import { CollapsedContext } from './CollapsedContext';

interface OrgPreviewProps {
  content: string;
  className?: string;
}

interface FrontmatterResult {
  data: Record<string, unknown> | null;
  body: string;
}

function extractFrontmatter(raw: string): FrontmatterResult {
  try {
    const tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml', 'toml']).parse(raw);
    const first = tree.children.at(0);

    if (first && (first.type === 'yaml' || first.type === 'toml') && 'value' in first) {
      const value = (first as { value: string }).value;
      const data =
        first.type === 'yaml'
          ? ((yaml.load(value) as Record<string, unknown>) ?? {})
          : (toml.parse(value) as Record<string, unknown>);

      // Remove the frontmatter block from the body
      const frontmatterRegex =
        first.type === 'yaml' ? /^---\n[\s\S]*?\n---\n?/ : /^\+\+\+\n[\s\S]*?\n\+\+\+\n?/;
      const body = raw.replace(frontmatterRegex, '');

      return { data, body };
    }
  } catch (err) {
    console.error('Failed to parse frontmatter', err);
  }

  return { data: null, body: raw };
}

// Custom heading component that supports collapsing
function CollapsibleHeading({
  level,
  children,
  id,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
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
  const mathRenderedRef = React.useRef(false);
  const [frontmatter, setFrontmatter] = React.useState<Record<string, unknown> | null>(null);

  // Render math (KaTeX) once per content render
  React.useEffect(() => {
    if (!contentRef.current || !renderedContent) return;

    if (mathRenderedRef.current) return;

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
      ignoredClasses: ['math', 'math-inline', 'math-display'],
      throwOnError: false,
      strict: false,
    });

    // Render Org-mode math nodes (.math-inline / .math-display) that come without delimiters
    const mathNodes = contentRef.current.querySelectorAll('.math-inline, .math-display');
    for (const node of Array.from(mathNodes)) {
      const element = node as HTMLElement;
      const tex = element.textContent || '';
      const displayMode = element.classList.contains('math-display');
      try {
        katex.render(tex, element, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch (err) {
        console.error('Failed to render math', err);
      }
    }

    mathRenderedRef.current = true;
  }, [renderedContent]);

  // Apply collapsed state to DOM elements
  React.useEffect(() => {
    if (!contentRef.current || !renderedContent) return;

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
        const { data: parsedFrontmatter, body } = extractFrontmatter(content);
        setFrontmatter(parsedFrontmatter);
        mathRenderedRef.current = false;

        const heading =
          (level: 1 | 2 | 3 | 4 | 5 | 6) =>
          (props: React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>) => (
            <CollapsibleHeading level={level} {...props} />
          );

        const components = {
          h1: heading(1),
          h2: heading(2),
          h3: heading(3),
          h4: heading(4),
          h5: heading(5),
          h6: heading(6),
        };

        const result = await unified()
          .use(uniorgParse)
          .use(uniorg2rehype)
          .use(rehypeSlug) // Add IDs to headings
          .use(rehype2react, { ...prod, components })
          .process(body);

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
      {frontmatter && Object.keys(frontmatter).length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Frontmatter</div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(frontmatter, null, 2)}
          </pre>
        </div>
      )}
      {renderedContent}
    </div>
  );
}
