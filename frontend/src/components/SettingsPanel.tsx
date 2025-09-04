import { useState } from 'react';

export interface Settings {
  provider: 'openai' | 'azure' | 'llama';
  api_key?: string;
  model?: string;
  endpoint?: string;
  template?: File | null;
  templateName?: string;
  remember: boolean;
  api_version?: string;
}

interface Props {
  initial: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ initial, onSave, onClose }: Props) {
  const [settings, setSettings] = useState<Settings>(initial);

  function handleChange<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, key: 'template') {
    const f = e.target.files?.[0] ?? null;
    handleChange(key, f);
    handleChange('templateName', f?.name as any);

    if (key === 'template' && f) {
      // Validate template via backend
      validateTemplate(f);
    } else if (key === 'template' && !f) {
      setTemplateDiag(null);
    }
  }

  // ---------------- Template diagnostics ----------------

  interface TemplateDiag {
    summary: 'ok' | 'warning' | 'error';
    diagnostics: { layout: string; status: string; message: string }[];
  }

  const [templateDiag, setTemplateDiag] = useState<TemplateDiag | null>(null);

  async function validateTemplate(file: File) {
    const fd = new FormData();
    fd.append('template', file);
    try {
      const res = await fetch('/template/validate', { method: 'POST', body: fd });
      if (!res.ok) {
        console.error('[Template] Validation failed', await res.text());
        setTemplateDiag({ summary: 'error', diagnostics: [{ layout: 'Upload', status: 'error', message: 'Validation HTTP error' }] });
        return;
      }
      const data = (await res.json()) as TemplateDiag;
      setTemplateDiag(data);
      console.log('[Template] Diagnostics', data);
    } catch (err) {
      console.error('[Template] Network error', err);
      setTemplateDiag({ summary: 'error', diagnostics: [{ layout: 'Upload', status: 'error', message: 'Network error' }] });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings.api_key?.trim()) {
      alert('API key is required');
      return;
    }
    onSave(settings);
  }

  // simple side-sheet overlay
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-80 h-full bg-white dark:bg-slate-900 p-6 flex flex-col overflow-y-auto"
      >
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        {/* provider */}
        <label className="text-sm font-medium">Provider</label>
        <select
          value={settings.provider}
          onChange={e => handleChange('provider', e.target.value as any)}
          className="border rounded px-2 py-1 mb-4 w-full"
        >
          <option value="openai">OpenAI (public)</option>
          <option value="azure">Azure OpenAI</option>
          <option value="llama">Llama HTTP</option>
        </select>

        {/* api key field for non-llama */}
        {settings.provider !== 'llama' && (
          <>
            <label className="text-sm font-medium">API Key</label>
            <input
              type="password"
              value={settings.api_key || ''}
              onChange={e => handleChange('api_key', e.target.value)}
              className="border rounded px-2 py-1 mb-4 w-full"
              required={(settings.provider as string) !== 'llama'}
            />
          </>
        )}

        {/* model */}
        <label className="text-sm font-medium">Model / Deployment name</label>
        <input
          type="text"
          value={settings.model || ''}
          onChange={e => handleChange('model', e.target.value)}
          className="border rounded px-2 py-1 mb-4 w-full"
        />

        {/* endpoint + api version for azure or llama */}
        {(settings.provider === 'azure' || settings.provider === 'llama') && (
          <>
            <label className="text-sm font-medium">Endpoint</label>
            <input
              type="url"
              value={settings.endpoint || ''}
              onChange={e => handleChange('endpoint', e.target.value)}
              placeholder="https://<your>.openai.azure.com"
              className="border rounded px-2 py-1 mb-4 w-full"
            />
          </>
        )}
        {settings.provider === 'azure' && (
          <>
            <label className="text-sm font-medium">API Version</label>
            <input
              type="text"
              value={settings.api_version || ''}
              onChange={e => handleChange('api_version', e.target.value)}
              placeholder="2024-05-01-preview"
              className="border rounded px-2 py-1 mb-4 w-full"
            />
          </>
        )}

        {/* template */}
        <label className="text-sm font-medium">Custom template (.pptx)</label>
        <input
          type="file"
          accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={e => handleFileChange(e, 'template')}
          className="mb-1 w-full"
        />
        {settings.template && <div className="text-sm font-medium text-green-700 mb-3">✔ {settings.template.name}</div>}

        {/* diagnostics */}
        {templateDiag && (
          <div className="mb-4 border rounded p-2 text-sm">
            <div className="font-medium mb-1">
              Template check:{' '}
              <span
                className={
                  templateDiag.summary === 'ok'
                    ? 'text-green-700'
                    : templateDiag.summary === 'warning'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }
              >
                {templateDiag.summary}
              </span>
            </div>
            <ul className="list-disc ml-4 space-y-0.5">
              {templateDiag.diagnostics.map((d, i) => (
                <li
                  key={i}
                  className={
                    d.status === 'ok'
                      ? 'text-green-700'
                      : d.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                >
                  <strong>{d.layout}:</strong> {d.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* remember */}
        <label className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            checked={settings.remember}
            onChange={e => handleChange('remember', e.target.checked)}
          />
          Remember these settings (localStorage)
        </label>

        <div className="mt-auto flex gap-2">
          <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded">
            Save
          </button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-300 py-2 rounded">
            Close
          </button>
        </div>
      </form>
    </div>
  );
}
