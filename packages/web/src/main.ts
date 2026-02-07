import './index.css';
import './components/app-root';
import './components/pages/home-page';
import './components/pages/viewer-page';
import './components/file-viewer';
import './components/page-layout';
import './components/input-zone';
import './components/file-picker';
import './components/loading-spinner';

// Register the app
const app = document.createElement('app-root');
const root = document.getElementById('root');
if (root) {
  root.appendChild(app);
}
