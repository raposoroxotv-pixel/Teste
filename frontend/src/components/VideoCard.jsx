import { useEffect, useRef } from 'react';

export default function VideoCard({ video, active, onLike, onFavorite, onVisible }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (active) {
      videoRef.current.play().catch(() => {});
      onVisible(video.id);
    } else {
      videoRef.current.pause();
    }
  }, [active, onVisible, video.id]);

  return (
    <article className="video-card">
      <video
        ref={videoRef}
        src={video.videoPath}
        poster={video.thumbnailPath || undefined}
        loop
        muted
        playsInline
        preload="metadata"
      />
      <div className="overlay">
        <div className="meta">
          <h2>{video.title}</h2>
          <p>{video.description || 'Sem descrição.'}</p>
          <small>
            {new Date(video.uploadDate).toLocaleString('pt-BR')} • {video.views} views
          </small>
          {video.tags?.length > 0 && (
            <div className="tags">
              {video.tags.map((tag) => (
                <span key={`${video.id}-${tag}`}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="actions">
          <button onClick={() => onLike(video.id)}>❤️ {video.likes}</button>
          <button onClick={() => onFavorite(video.id)}>⭐ {video.favorites}</button>
        </div>
      </div>
    </article>
  );
}
