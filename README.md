# Epistle

A simple web app for writing encrypted letters. Compose a message, seal it with
a passphrase, and share the generated link. Only someone with both the link and
the passphrase can unseal and read it.

Everything runs client-side — no server stores your letters.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev    # start dev server
bun run build  # production build
bun test       # run tests
bun run check  # lint & format
```

## License

MIT License. See [LICENSE](LICENSE).
