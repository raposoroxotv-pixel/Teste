# Painel de Vídeos Local

Aplicativo web (uso local no computador) para:

- Selecionar uma pasta com vídeos.
- Exibir os vídeos em um painel/lista.
- Reproduzir o vídeo selecionado.
- Embaralhar a ordem de reprodução.
- Ir para o vídeo anterior/próximo.

## Como executar

1. Entre na pasta do projeto.
2. Inicie um servidor HTTP local:

```bash
python3 -m http.server 8000
```

3. Abra no navegador:

```text
http://localhost:8000
```

## Como usar

1. Clique em **Selecionar pasta de vídeos**.
2. Escolha a pasta que contém seus vídeos.
3. Use:
   - **Embaralhar ordem** para ordem aleatória.
   - **Anterior** e **Próximo** para navegar.
4. Clique em qualquer item da lista para tocar aquele vídeo.

> Observação: por segurança do navegador, os vídeos são escolhidos localmente pelo usuário a cada sessão.
