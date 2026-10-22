# Rapidez para a Play Store

A app abre o site publicado. Não é um APK solto: a Google Play exige um Android App Bundle (`.aab`).

1. Publica o site e copia o endereço https.
2. Copia `local.properties.example` para `local.properties`.
3. Escreve `rapidez.url=https://o-teu-endereco` e o `sdk.dir` do Android Studio.
4. Cria a chave de envio, uma vez, e não a percas:

```
keytool -genkeypair -v -keystore rapidez-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rapidez
```

5. Copia `keystore.properties.example` para `keystore.properties` e põe a senha e o nome do ficheiro `.jks`.
6. No Android Studio: **Build > Build Bundle(s) / APK(s) > Build Bundle(s)**.
7. O ficheiro fica em `app/build/outputs/bundle/release/app-release.aab`. Sobe esse ficheiro na Play Console.

`local.properties`, `keystore.properties` e o `.jks` não entram no Git.

O iPhone está na pasta `ios`. No Safari também dá para usar **Adicionar ao ecrã principal**, sem App Store.
