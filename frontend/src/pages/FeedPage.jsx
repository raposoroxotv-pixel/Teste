import { useEffect, useMemo, useRef, useState } from 'react';
import VideoCard from '../components/VideoCard';

export default function FeedPage({ videos, onLike, onFavorite, onViewed }) {
  const [activeId, setActiveId] = useState(videos[0]?.id || null);
  const [loadedCount, setLoadedCount] = useState(4);
  const observerRef = useRef(null);
  const viewed = useRef(new Set());

  const visibleVideos = useMemo(() => videos.slice(0, loadedCount), [videos, loadedCount]);

  useEffect(() => {
    setActiveId(videos[0]?.id || null);
    setLoadedCount((count) => Math.max(4, Math.min(count, videos.length || 4)));
    viewed.current.clear();
  }, [videos]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
            const id = Number(entry.target.dataset.id);
            setActiveId(id);

            const lastId = visibleVideos[visibleVideos.length - 1]?.id;
            if (id === lastId && loadedCount < videos.length) {
              setLoadedCount((current) => Math.min(current + 3, videos.length));
            }
          }
        });
      },
      { threshold: [0.65, 0.9] }
    );

    const cards = document.querySelectorAll('.video-card');
    cards.forEach((node) => observerRef.current.observe(node));

    return () => observerRef.current?.disconnect();
  }, [visibleVideos, loadedCount, videos.length]);

  const handleVisible = (id) => {
    if (viewed.current.has(id)) return;
    viewed.current.add(id);
    onViewed(id);
  };

  if (!videos.length) {
    return (
      <section className="empty-state">
        <h2>Nenhum vídeo ainda</h2>
        <p>Use o painel à esquerda para enviar seu primeiro vídeo.</p>
      </section>
    );
  }

  return (
    <section className="feed-wrapper">
      {visibleVideos.map((video) => (
        <div key={video.id} data-id={video.id} className="card-anchor">
          <VideoCard
            video={video}
            active={activeId === video.id}
            onLike={onLike}
            onFavorite={onFavorite}
            onVisible={handleVisible}
          />
        </div>
      ))}
    </section>
  );
}
