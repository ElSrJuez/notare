import { useState } from 'react';
import UrlInput from './components/UrlInput';
import ArticleViewer from './components/ArticleViewer';

function App() {
  const [html, setHtml] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Notāre</h1>
      <UrlInput onLoaded={setHtml} />
      <ArticleViewer html={html} />
    </div>
  );
}
export default App;
