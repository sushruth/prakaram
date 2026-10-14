import { render } from 'preact';
import { App } from './App';
import './styles/index.css';

// The bundled corpus renders at once. A live source is fetched on demand when a route asks for one
// (see src/services/sourceAdapter.ts); nothing is fetched here.
render(<App />, document.getElementById('app')!);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
