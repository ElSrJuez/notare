import { useState, useRef } from 'react';
import UrlInput from './components/UrlInput';
import ArticleViewer from './components/ArticleViewer';
import SettingsPanel, { Settings } from './components/SettingsPanel';
import logo from '../../assets/logo/notare-logo.png';
import Toast from './components/Toast';

const LS_KEY = 'notareSettings';

function App() {
  const [html, setHtml] = useState('');
  const viewerRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg:string,type:'info'|'error'|'success'}|null>(null);
  const stored = localStorage.getItem(LS_KEY);
  const defaultSettings: Settings = stored
    ? { template: null, layoutMap: null, ...JSON.parse(stored) }
    : { provider: 'openai', api_key: '', model: 'gpt-4o-chat-bison', endpoint: '', api_version: '', template: null, templateName: undefined, layoutMap: null, layoutName: undefined, remember: false };
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [panelOpen, setPanelOpen] = useState(false);

  function push(msg:string,type:'info'|'error'|'success'='info'){console.log('[Toast]',msg);setToast({msg,type});}

  async function handleGenerate() {
    if (!viewerRef.current) return;
    if (settings.provider === 'openai' && !settings.api_key) {
      alert('API key missing');
      setPanelOpen(true);
      return;
    }
    if (settings.template) {
      push(`Template selected ${settings.template.name} (${(settings.template.size/1024).toFixed(1)} KB)`,'info');
      console.log('[Checkpoint1] template file object', settings.template);
    } else {
      push('No template selected – using blank deck','info');
    }
    setLoading(true);
    try {
      const annotatedHtml = viewerRef.current.outerHTML;
      console.log('[PPTX] Sending annotated HTML length', annotatedHtml.length);
      const fd = new FormData();
      fd.append('settings', JSON.stringify({ provider: settings.provider, api_key: settings.api_key, model: settings.model, endpoint: settings.endpoint, api_version: settings.api_version }));
      if (settings.template) {
        console.log('[PPTX] Attaching template', settings.template.name, settings.template.size);
        fd.append('template', settings.template);
      }
      if (settings.layoutMap) {
        console.log('[PPTX] Attaching layout_map', settings.layoutMap.name, settings.layoutMap.size);
        fd.append('layout_map', settings.layoutMap);
      }
      fd.append('html', annotatedHtml);

      console.log('[Checkpoint2] FormData before send');
      for(const [k,v] of fd.entries()){console.log('  ',k, v instanceof File? v.name: v);}
      push('Uploading content to backend…','info');

      const res = await fetch('/pptx', {
        method: 'POST',
        body: fd,
      });
      console.log('[PPTX] Response status', res.status);
      if (!res.ok) {
        console.error('[PPTX] Error', await res.text());
        push('Backend error while generating PPTX','error');
        throw new Error('PPTX generation failed');
      }
      push('PPTX generated – downloading…','success');
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
      // exclude file-related fields so they aren’t falsely persisted
      const { template, layoutMap, templateName, layoutName, ...persistable } = newSet;
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
      {toast && <Toast message={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </div>
  );
}

export default App;
