# Painel de Vídeos Local

Aplicativo web (uso local no computador) para:

- Adicionar vídeos avulsos.
- Adicionar pastas inteiras com vídeos.
- Salvar essa biblioteca no próprio aplicativo para reutilizar depois.
- Exibir os vídeos em uma lista e reproduzir no player.
- Embaralhar a ordem de reprodução.
- Ir para o vídeo anterior/próximo.

## Como executar

1. Entre na pasta do projeto.
2. Inicie o servidor do app:

```bash
python3 app.py
```

3. Abra no navegador:

```text
http://localhost:5000
```

## Como usar

1. Clique em **Adicionar vídeos** para enviar arquivos avulsos.
2. Clique em **Adicionar pasta de vídeos** para enviar uma pasta inteira.
3. Os vídeos enviados ficam salvos na pasta `media_library` do aplicativo.
4. Use:
   - **Embaralhar ordem** para ordem aleatória.
   - **Anterior** e **Próximo** para navegar.
5. Clique em qualquer item da lista para tocar aquele vídeo.
