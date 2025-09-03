import { useState } from 'react';

interface Props {
  onLoaded: (html: string) => void;
}

export default function UrlInput({ onLoaded }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      console.log('[Normalize] POST /normalize', url);
      const res = await fetch('/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      console.log('[Normalize] Response status', res.status);
      if (!res.ok) {
        console.error('[Normalize] Error response', await res.text());
        return;
      }
      const data = await res.json();
      console.log('[Normalize] clean_html length', data.clean_html?.length);
      onLoaded(data.clean_html);
    } catch (err) {
      console.error('[Normalize] Network/error', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-2 mb-4">
      <input
        type="url"
        placeholder="Paste article URL…"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="flex-1 border rounded px-3 py-2"
        required
      />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? 'Loading…' : 'Normalize'}
      </button>
    </form>
  );
}
