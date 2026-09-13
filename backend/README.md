# Rajya backend

From the repository root, `bin/dev` runs Rails, a separate Solid Queue worker,
and Vite from `Procfile.dev`.

From this directory, `bin/dev` runs Rails/Puma with Solid Queue embedded. It
accepts the usual Rails server arguments, for example `bin/dev -p 3001`.

`bin/rails server` alone is web-only. Set `SOLID_QUEUE_IN_PUMA=true` explicitly
only when an embedded worker is wanted.
