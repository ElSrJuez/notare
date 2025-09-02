import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface Props {
  html: string;
}

export default forwardRef(function ArticleViewer({ html }: Props, outRef) {
  const localRef = useRef<HTMLElement>(null);
  useImperativeHandle(outRef, () => localRef.current as HTMLElement | null);

  // Wrap each word in span.word on render
  useEffect(() => {
    if (!localRef.current) return;
    localRef.current.innerHTML = html;

    // Walk text nodes and wrap words
    const walker = document.createTreeWalker(localRef.current, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const tn = walker.currentNode as Text;
      const tag = tn.parentElement?.tagName;
      if (tag && ['SCRIPT', 'STYLE', 'MARK'].includes(tag)) continue;
      if (tn.textContent?.trim()) textNodes.push(tn);
    }
    textNodes.forEach(tn => {
      const parts = tn.textContent!.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach(p => {
        if (/^\s+$/.test(p)) {
          frag.appendChild(document.createTextNode(p));
        } else {
          const span = document.createElement('span');
          span.textContent = p;
          span.className = 'word';
          frag.appendChild(span);
        }
      });
      tn.replaceWith(frag);
    });
    // Debug: list paragraphs without wrapped words (e.g., inside blockquotes)
    console.log('Unwrapped paragraphs', localRef.current.querySelectorAll('p:not(:has(span.word))'));
    console.log('words wrapped:', localRef.current!.querySelectorAll('span.word').length);
  }, [html]);

  // Click to highlight whole sentence
  function onClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    // If clicked inside a link, only navigate on Ctrl/Cmd-click
    const anchor = target.closest('a');
    if (anchor) {
      if (!(e.ctrlKey || e.metaKey)) {
        // Disable navigation so we can still highlight
        e.preventDefault();
      } else {
        // Ctrl/Meta-click should follow the link – no highlighting
        return;
      }
    }

    // Ensure we are working with the <span class="word"> element even if a parent was clicked
    const word = target.closest('span.word') as HTMLElement | null;
    if (!word) return;

    // Toggle: if this word is already inside a mark, remove the highlight
    const existing = word.closest('mark.notare-mark') as HTMLElement | null;
    if (existing) {
      const parent = existing.parentNode!;
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
      existing.remove();
      return;
    }

    const para = word.closest('p, li, blockquote, h1, h2, h3') as HTMLElement;
    if (!para) return;
    const words = Array.from(para.querySelectorAll('span.word')).filter(w => w.textContent?.trim()) as HTMLElement[];
    const idx = words.indexOf(word);
    if (idx === -1) return;
    console.log('Clicked word', target.textContent, 'index', idx);
    const punct = /[.!?]/;
    const isBoundary = (w: HTMLElement) => punct.test((w.textContent || '').slice(-1));
    let start = idx;
    while (start > 0 && !isBoundary(words[start - 1])) start--;

    let end = idx;
    while (end < words.length - 1 && !isBoundary(words[end])) end++;
    // wrap selected range if not already in mark
    const first = words[start];
    if (first.closest('mark')) return;
    const range = document.createRange();
    range.setStartBefore(words[start]);
    range.setEndAfter(words[end]);
    const frag = range.cloneContents();
    const mark = document.createElement('mark');
    mark.className = 'notare-mark';
    mark.appendChild(frag);
    range.deleteContents();
    range.insertNode(mark);
    console.log('Sentence range', words[start].textContent, '...', words[end].textContent);
    console.log('PARA TEXT:', para.innerText);
    console.log('WORDS IN PARA:', words.map(w => w.textContent));
  }

  if (!html) return null;
  return (
    <article
      ref={localRef}
      onClick={onClick}
      className="prose lg:prose-lg bg-white p-6 rounded shadow max-w-3xl cursor-pointer select-none"
    />
  );
});
