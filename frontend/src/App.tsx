import { useState, useRef } from 'react';
import UrlInput from './components/UrlInput';
import ArticleViewer from './components/ArticleViewer';

function App() {
  const [html, setHtml] = useState('');
  const viewerRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!viewerRef.current) return;
    setLoading(true);
    try {
      const annotatedHtml = viewerRef.current.outerHTML;
      const res = await fetch('http://localhost:8000/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: annotatedHtml }),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'outline.pptx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed: ' + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Notāre</h1>
      <UrlInput onLoaded={setHtml} />
      {html && (
        <button
          onClick={handleGenerate}
          className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate PPTX'}
        </button>
      )}
      <ArticleViewer ref={viewerRef} html={html} />
    </div>
  );
}

export default App;
