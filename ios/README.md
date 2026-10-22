# Rapidez no iPhone

Há dois caminhos. Os dois abrem a mesma app.

## Sem App Store

No Safari, abre o site publicado e escolhe **Adicionar ao ecrã principal**. Fica em ecrã inteiro, com o mapa e o login. Não precisa de Mac.

## App Store

1. Publica o site e copia o https.
2. Em `Rapidez/Info.plist`, na chave `RAPIDEZ_URL`, cola esse endereço.
3. Num Mac com Xcode, abre `Rapidez.xcodeproj`.
4. Product > Archive, e envia com a conta Apple Developer.

Daqui não se gera o ficheiro do iPhone. O GPS e a câmara funcionam com a app aberta.
