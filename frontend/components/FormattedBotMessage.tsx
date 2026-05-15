'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const components: Components = {
  p: ({ children }) => <p className="fbm-p">{children}</p>,
  strong: ({ children }) => <strong className="fbm-strong">{children}</strong>,
  em: ({ children }) => <em className="fbm-em">{children}</em>,
  ul: ({ children }) => <ul className="fbm-ul">{children}</ul>,
  ol: ({ children }) => <ol className="fbm-ol">{children}</ol>,
  li: ({ children }) => <li className="fbm-li">{children}</li>,
  h1: ({ children }) => (
    <h3 className="fbm-h fbm-h--1">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="fbm-h fbm-h--2">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="fbm-h fbm-h--3">{children}</h3>
  ),
  code: ({ className, children, ...props }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="fbm-code--inline" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="fbm-pre">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="fbm-a">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="fbm-blockquote">{children}</blockquote>
  ),
  hr: () => <hr className="fbm-hr" />,
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
