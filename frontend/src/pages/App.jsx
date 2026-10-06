import { EditorPage } from './EditorPage';
import { GardenListPage } from './GardenListPage';
export function App() {
    const match = window.location.pathname.match(/^\/gardens\/([^/]+)\/?$/);
    const gardenId = match ? decodeURIComponent(match[1]) : null;
    return gardenId ? <EditorPage gardenId={gardenId}/> : <GardenListPage />;
}
