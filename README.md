# UNPKG (fork)
# Red Bull Use Case
[Read me first](REDBULL.md)

<h1 align="center">UNPKG-SERVER</h1>

**The goals of this fork are:**

* Make it easier to self-host Unpkg.
* Keep it upstream compatible.
* Keep dependencies up to date.
* Make no functional changes or add new features.
------

[UNPKG](https://unpkg.com) is a fast, global [content delivery network](https://en.wikipedia.org/wiki/Content_delivery_network) for everything on [npm](https://www.npmjs.com/).

# unpkg-server

**unpkg-server** is a distribution of [UNPKG](https://unpkg.com) you can run on your own network with your own private npm registry

## Private Hosting

Install `unpkg-server` locally. (Global install is not yet supported)

```sh
npm i unpkg-server
```

Start the server:

```sh
node node_modules/unpkg-server/server.js \
  --NPM_REGISTRY_URL=https://private-npm-registry.example.org \
  --PORT=8081
```

**Caution:** if your registry is using self-signed certificates, you can accept the cert by setting the following flag.
**Use at your own risk**

`--NODE_TLS_REJECT_UNAUTHORIZED=0`

## CLI Options

These values can be set on the system environment when starting the unpkg `server.js`.

| Flag                   | Options / Description                            | Default value                |
| ---------------------- | ------------------------------------------------ | ---------------------------- |
| `NPM_REGISTRY_URL`     | optional - private registry url                  | `https://registry.npmjs.org` |
| `PORT`                 | optional - port to listen on                     | `8080`                       |
| `GOOGLE_CLOUD_PROJECT` | The GCP project ID.                              | `null`                       |
| `GAE_ENV`              | `standard` to enable `@google-cloud/trace-agent` | `null`                       |
| `DEBUG`                | enableDebugging                                  | `false`                      |
| `ENABLE_CLOUDFLARE`    | optional `true` or `false`                       | `false`                      |
| `ORIGIN`               | optional                                         | `https://unpkg.com`          |
| `CLOUDFLARE_EMAIL`     | optional                                         | `null`                       |
| `CLOUDFLARE_KEY`       | optional                                         | `null`                       |

## Build Options

Use a `.env` file to set the following options when building the app with `npm run build`. These values will be bundled into the built `server.js` file.

| Flag        | Options / Description                    | Default value |
| ----------- | ---------------------------------------- | ------------- |
| `BUILD_ENV` | `production` or `development`            | `development` |
| `NODE_ENV`  | `production`, `staging` or `development` | `development` |

## Documentation

Please visit [the UNPKG website](https://unpkg.com) to learn more about how to use it.

## Sponsors

Our sponsors and backers are listed [in SPONSORS.md](SPONSORS.md).
