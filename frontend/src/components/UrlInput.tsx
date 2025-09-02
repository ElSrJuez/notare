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
      const res = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      onLoaded(data.clean_html);
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
