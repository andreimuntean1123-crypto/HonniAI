'use client';

import { Fragment, useMemo } from 'react';
import { clsx } from 'clsx';

/**
 * Minimal, dependency-free Markdown renderer for agent answers.
 *
 * Supports headings, bullet/numbered lists, blockquotes, bold, italic and
 * inline code — which is exactly the subset the agents are told to produce.
 * It builds React elements (never `dangerouslySetInnerHTML`), so model output
 * cannot inject markup.
 */

type Block =
  | { type: 'h'; level: 2 | 3; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r/g, '').split('\n');
  let buffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (buffer.length) {
      blocks.push({ type: 'p', text: buffer.join(' ').trim() });
      buffer = [];
    }
  };
  /** Ends the current list so the next bullet starts a fresh one. */
  const flushList = () => {
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'h',
        level: heading[1].length <= 2 ? 2 : 3,
        text: heading[2],
      });
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (listType === 'ul' && last && last.type === 'ul') last.items.push(bullet[1]);
      else {
        blocks.push({ type: 'ul', items: [bullet[1]] });
        listType = 'ul';
      }
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (numbered) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (listType === 'ol' && last && last.type === 'ol') last.items.push(numbered[1]);
      else {
        blocks.push({ type: 'ol', items: [numbered[1]] });
        listType = 'ol';
      }
      continue;
    }

    listType = null;
    buffer.push(trimmed);
  }
  flushParagraph();
  return blocks;
}

/** Handles **bold**, *italic* and `code` inside a line. */
function Inline({ text }: { text: string }) {
  const parts = useMemo(() => {
    const out: { kind: 'text' | 'b' | 'i' | 'code'; value: string }[] = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ kind: 'text', value: text.slice(last, m.index) });
      const token = m[0];
      if (token.startsWith('**')) out.push({ kind: 'b', value: token.slice(2, -2) });
      else if (token.startsWith('`')) out.push({ kind: 'code', value: token.slice(1, -1) });
      else out.push({ kind: 'i', value: token.slice(1, -1) });
      last = m.index + token.length;
    }
    if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
    return out;
  }, [text]);

  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === 'b') return <strong key={i} className="font-semibold text-ink">{p.value}</strong>;
        if (p.kind === 'i') return <em key={i}>{p.value}</em>;
        if (p.kind === 'code')
          return (
            <code
              key={i}
              className="rounded-md bg-ink/[0.07] px-1.5 py-0.5 text-[0.85em] dark:bg-white/10"
            >
              {p.value}
            </code>
          );
        return <Fragment key={i}>{p.value}</Fragment>;
      })}
    </>
  );
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = useMemo(() => parse(content), [content]);

  return (
    <div className={clsx('space-y-3 text-[0.94rem] leading-relaxed text-ink-soft', className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h':
            return block.level === 2 ? (
              <h3
                key={i}
                className="pt-1 font-display text-base font-semibold tracking-tight text-ink"
              >
                <Inline text={block.text} />
              </h3>
            ) : (
              <h4 key={i} className="font-medium text-ink">
                <Inline text={block.text} />
              </h4>
            );
          case 'ul':
            return (
              <ul key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                      {j + 1}
                    </span>
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote
                key={i}
                className="rounded-xl border-l-2 border-brand-500/60 bg-brand-500/[0.06] px-3.5 py-2.5 text-sm"
              >
                <Inline text={block.text} />
              </blockquote>
            );
          default:
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

export default Markdown;
