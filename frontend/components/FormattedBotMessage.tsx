'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const accent = '#93c5fd';
const muted = '#a3a3a3';

const components: Components = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 0.65em 0', lineHeight: 1.55, color: '#e5e5e5' }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#fff', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: accent, fontStyle: 'italic' }}>{children}</em>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '0.35em 0 0.65em 0', paddingLeft: '1.25em', color: '#e5e5e5' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '0.35em 0 0.65em 0', paddingLeft: '1.25em', color: '#e5e5e5' }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: '0.35em', lineHeight: 1.5 }}>{children}</li>,
  h1: ({ children }) => (
    <h3 style={{ margin: '0.5em 0 0.35em 0', fontSize: 16, fontWeight: 700, color: '#fff' }}>{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 style={{ margin: '0.5em 0 0.35em 0', fontSize: 15, fontWeight: 700, color: '#fff' }}>{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 style={{ margin: '0.45em 0 0.3em 0', fontSize: 14, fontWeight: 700, color: accent }}>{children}</h3>
  ),
  code: ({ className, children, ...props }) => {
    const inline = !className;
    if (inline) {
      return (
        <code
          style={{
            background: '#2a2a2a',
            color: '#fbbf24',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '0.92em',
            fontFamily: 'ui-monospace, monospace',
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        style={{
          margin: '0.5em 0',
          padding: 12,
          background: '#0d0d0d',
          border: '1px solid #333',
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        <code style={{ fontFamily: 'ui-monospace, monospace', color: '#d4d4d4' }} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: '0.5em 0',
        paddingLeft: 12,
        borderLeft: '3px solid #3b82f6',
        color: muted,
        fontSize: '0.95em',
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0' }} />,
};

type Props = {
  content: string;
};

export function FormattedBotMessage({ content }: Props) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return (
    <div className="formatted-bot-md">
      <ReactMarkdown components={components}>{trimmed}</ReactMarkdown>
    </div>
  );
}
