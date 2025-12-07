'use client';

import * as React from 'react';
import * as prod from 'react/jsx-runtime';
import rehype2react from 'rehype-react';
import { unified } from 'unified';
import uniorgParse from 'uniorg-parse';
import uniorg2rehype from 'uniorg-rehype';

interface OrgPreviewProps {
  content: string;
  className?: string;
}

export function OrgPreview({ content, className }: OrgPreviewProps) {
  const [renderedContent, setRenderedContent] = React.useState<React.ReactElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const parseOrgContent = async () => {
      try {
        const result = await unified()
          .use(uniorgParse)
          .use(uniorg2rehype)
          .use(rehype2react, prod)
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
      className={`prose prose-slate max-w-none dark:prose-invert ${className || ''}`}
      style={{
        lineHeight: '1.75',
      }}
    >
      {renderedContent}
    </div>
  );
}
