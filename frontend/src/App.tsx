import { useState, useRef } from 'react';
import UrlInput from './components/UrlInput';
import ArticleViewer from './components/ArticleViewer';
import SettingsPanel, { Settings } from './components/SettingsPanel';
import logo from '../../assets/logo/notare-logo.png';

const LS_KEY = 'notareSettings';

function App() {
  const [html, setHtml] = useState('');
  const viewerRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const stored = localStorage.getItem(LS_KEY);
  const defaultSettings: Settings = stored
    ? { template: null, layoutMap: null, ...JSON.parse(stored) }
    : { provider: 'openai', api_key: '', model: 'gpt-4o-chat-bison', endpoint: '', api_version: '', template: null, templateName: undefined, layoutMap: null, layoutName: undefined, remember: false };
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [panelOpen, setPanelOpen] = useState(false);

  async function handleGenerate() {
    if (!viewerRef.current) return;
    if (settings.provider === 'openai' && !settings.api_key) {
      alert('API key missing');
      setPanelOpen(true);
      return;
    }
    setLoading(true);
    try {
      const annotatedHtml = viewerRef.current.outerHTML;
      console.log('[PPTX] Sending annotated HTML length', annotatedHtml.length);
      const fd = new FormData();
      fd.append('settings', JSON.stringify({ provider: settings.provider, api_key: settings.api_key, model: settings.model, endpoint: settings.endpoint, api_version: settings.api_version }));
      if (settings.template) fd.append('template', settings.template);
      if (settings.layoutMap) fd.append('layout_map', settings.layoutMap);
      fd.append('html', annotatedHtml);

      const res = await fetch('/pptx', {
        method: 'POST',
        body: fd,
      });
      console.log('[PPTX] Response status', res.status);
      if (!res.ok) {
        console.error('[PPTX] Error response', await res.text());
        throw new Error('PPTX generation failed');
      }
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

  function saveSettings(newSet: Settings) {
    setSettings(newSet);
    if (newSet.remember) {
      const { template, layoutMap, ...persistable } = newSet;
      localStorage.setItem(LS_KEY, JSON.stringify(persistable));
    } else {
      localStorage.removeItem(LS_KEY);
    }
    setPanelOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <img src={logo} alt="Notāre logo" className="w-24 mb-2" />
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

      {/* floating settings button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
      >
        ⚙️
      </button>

      {panelOpen && (
        <SettingsPanel initial={settings} onSave={saveSettings} onClose={() => setPanelOpen(false)} />
      )}
    </div>
  );
}

export default App;
