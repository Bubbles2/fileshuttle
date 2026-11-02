import type { ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type HeadingTag = 'h3' | 'h4' | 'h5' | 'h6';

/** The page title is an h2, so the guide's own headings start at h3. */
function headingAs(Tag: HeadingTag) {
  return function Heading({ children }: { children?: ReactNode }) {
    return <Tag>{children}</Tag>;
  };
}

function Link({ href, children }: { href?: string; children?: ReactNode }) {
  const external = href !== undefined && !href.startsWith('#');
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {children}
    </a>
  );
}

const COMPONENTS: Components = {
  h1: headingAs('h3'),
  h2: headingAs('h4'),
  h3: headingAs('h5'),
  h4: headingAs('h6'),
  h5: headingAs('h6'),
  h6: headingAs('h6'),
  a: Link,
};

/**
 * Renders Markdown as React elements (no raw HTML is ever injected; react-markdown
 * ignores embedded HTML and sanitises link URLs). Styles live in `.markdown` in index.css.
 */
export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="markdown">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {markdown}
      </Markdown>
    </div>
  );
}
