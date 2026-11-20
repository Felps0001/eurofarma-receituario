# Eurofarma — Game de receituário

Game offline de receituário para totens Windows com tela vertical. O participante responde a cinco perguntas escrevendo na tela e pode consultar as bulas e referências dos produtos.

## Executar

- **Windows x64:** baixe o executável portátil em [Releases](https://github.com/Felps0001/eurofarma-receituario/releases) e abra o arquivo.
- **Navegador:** baixe o código-fonte e abra `game-offline/index.html` no Chrome ou Edge. Use `F11` para alternar a tela cheia.

## Compilar para Windows

Com Node.js e npm instalados, execute a partir da raiz do repositório:

```powershell
cd desenvolvimento/electron
npm ci
npm run build
```

O executável é gerado em `desenvolvimento/electron/dist/`. A compilação inclui os arquivos de `game-offline/`, com as bulas, referências e imagens usadas no game.
