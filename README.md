# Voxel Mundo 3D (browser)

Jogo voxel em primeira pessoa feito com **HTML + CSS + JavaScript + Three.js**.

## Como executar

1. Entre na pasta do projeto.
2. Rode um servidor HTTP local (exemplo com Python):

```bash
python3 -m http.server 8000
```

3. Abra no navegador:

```text
http://localhost:8000
```

## Controles

- **WASD**: mover
- **Espaço**: pular (somente no chão)
- **Mouse**: olhar
- **Clique esquerdo**: remover bloco
- **Clique direito**: colocar bloco
- **Q**: alternar bloco selecionado (grama/terra)

## Regras do mundo

- Mundo limitado a **30 × 30 × 30**
- Base sólida inicial com blocos de **terra** e **grama**
- Apenas dois tipos de bloco: **grama** e **terra**
- Colisão por caixa para o jogador e para interação com blocos
