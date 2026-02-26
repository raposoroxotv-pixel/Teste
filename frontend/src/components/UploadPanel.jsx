import { useRef, useState } from 'react';

const accepted = '.mp4,.webm,.mov';

export default function UploadPanel({ onUploaded }) {
  const [form, setForm] = useState({ title: '', description: '', tags: '' });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const sendFile = async (file) => {
    if (!file) return;
    setLoading(true);

    const data = new FormData();
    data.append('video', file);
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('tags', form.tags);

    try {
      const response = await fetch('/api/videos/upload', { method: 'POST', body: data });
      if (!response.ok) throw new Error('Falha no upload do vídeo');
      const created = await response.json();
      setForm({ title: '', description: '', tags: '' });
      onUploaded(created);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    sendFile(file);
  };

  return (
    <aside className="upload-panel">
      <h1>LocalTok</h1>
      <p>Seu feed local de vídeos curtos, totalmente offline.</p>

      <div
        className={`drop-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        Arraste e solte um vídeo aqui
        <span>ou</span>
        <button onClick={() => fileRef.current?.click()} disabled={loading}>
          {loading ? 'Enviando...' : 'Selecionar vídeo'}
        </button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept={accepted}
          onChange={(e) => sendFile(e.target.files?.[0])}
        />
      </div>

      <div className="form-grid">
        <input
          placeholder="Título (opcional)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Tags separadas por vírgula"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
      </div>
    </aside>
  );
}
