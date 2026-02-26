import { useEffect, useState } from 'react';
import UploadPanel from './components/UploadPanel';
import FeedPage from './pages/FeedPage';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');

  const loadVideos = async (query = '') => {
    const suffix = query ? `?search=${encodeURIComponent(query)}` : '';
    const response = await fetch(`/api/videos${suffix}`);
    const data = await response.json();
    setVideos(data);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const updateCounter = async (id, type) => {
    const response = await fetch(`/api/videos/${id}/${type}`, { method: 'PATCH' });
    if (!response.ok) return;
    const value = await response.json();

    setVideos((current) =>
      current.map((video) =>
        video.id === id
          ? {
              ...video,
              ...value
            }
          : video
      )
    );
  };

  return (
    <main className="layout">
      <UploadPanel
        onUploaded={(newVideo) => {
          setVideos((current) => [newVideo, ...current]);
        }}
      />

      <section className="content">
        <header className="top-bar">
          <input
            type="search"
            value={search}
            placeholder="Buscar por título, descrição ou tags"
            onChange={(event) => setSearch(event.target.value)}
          />
          <button onClick={() => loadVideos(search)}>Buscar</button>
          <button onClick={() => { setSearch(''); loadVideos(''); }}>Limpar</button>
        </header>

        <FeedPage
          videos={videos}
          onLike={(id) => updateCounter(id, 'like')}
          onFavorite={(id) => updateCounter(id, 'favorite')}
          onViewed={(id) => updateCounter(id, 'view')}
        />
      </section>
    </main>
  );
}
