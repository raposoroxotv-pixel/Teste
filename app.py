from __future__ import annotations

import json
import mimetypes
import shutil
import subprocess
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)


def is_youtube_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False

    if parsed.scheme not in {"http", "https"}:
        return False

    hostname = (parsed.hostname or "").lower()
    return hostname in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}


def check_dependencies() -> str | None:
    if shutil.which("yt-dlp") is None:
        return "Dependência ausente: instale 'yt-dlp' no sistema."
    if shutil.which("ffmpeg") is None:
        return "Dependência ausente: instale 'ffmpeg' no sistema."
    return None


def convert_youtube_to_mp3(url: str) -> Path:
    output_template = str(DOWNLOADS_DIR / "%(title).120B-%(id)s.%(ext)s")
    command = [
        "yt-dlp",
        "--no-playlist",
        "--no-warnings",
        "--extract-audio",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "--print",
        "after_move:filepath",
        "--output",
        output_template,
        url,
    ]

    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        message = completed.stderr.strip() or completed.stdout.strip() or "Falha ao converter vídeo para MP3."
        raise RuntimeError(message)

    lines = [line.strip() for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError("Conversão executada, mas o arquivo MP3 final não foi identificado.")

    output_path = Path(lines[-1])
    if not output_path.exists():
        raise RuntimeError("O arquivo MP3 não foi encontrado após a conversão.")

    return output_path


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/":
            self.path = "/index.html"
            return super().do_GET()

        if self.path.startswith("/downloads/"):
            raw_name = self.path.removeprefix("/downloads/")
            filename = Path(unquote(raw_name)).name
            file_path = DOWNLOADS_DIR / filename
            if not file_path.exists() or not file_path.is_file():
                return self.send_error(HTTPStatus.NOT_FOUND, "Arquivo não encontrado")

            ctype = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            data = file_path.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Disposition", f'attachment; filename="{file_path.name}"')
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/youtube-to-mp3":
            return self.send_error(HTTPStatus.NOT_FOUND, "Rota não encontrada")

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return self.send_json({"error": "JSON inválido."}, status=400)

        youtube_url = str(payload.get("url", "")).strip()
        if not youtube_url:
            return self.send_json({"error": "URL do YouTube é obrigatória."}, status=400)

        if not is_youtube_url(youtube_url):
            return self.send_json({"error": "Informe uma URL válida do YouTube."}, status=400)

        dep_error = check_dependencies()
        if dep_error:
            return self.send_json({"error": dep_error}, status=500)

        try:
            mp3_path = convert_youtube_to_mp3(youtube_url)
        except RuntimeError as exc:
            return self.send_json({"error": str(exc)}, status=500)

        return self.send_json(
            {
                "filename": mp3_path.name,
                "download_url": f"/downloads/{mp3_path.name}",
            }
        )


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 5000), AppHandler)
    print("Servidor iniciado em http://0.0.0.0:5000")
    server.serve_forever()
