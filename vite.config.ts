import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

/** The shop's notes endpoint while it runs locally: it takes a voice note and answers its size. Nothing is kept. */
function notesApi(): Plugin {
  let sent = 0;
  return {
    name: "notes-api",
    configureServer(server) {
      server.middlewares.use("/api/health", (req, res) => {
        if (req.method !== "GET") {
          res.writeHead(405, { allow: "GET" }).end();
          return;
        }
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: true }));
      });
      server.middlewares.use("/api/notes", (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405, { allow: "POST" }).end();
          return;
        }
        let bytes = 0;
        req.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
        });
        req.on("end", () => {
          sent += 1;
          res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ id: sent, bytes }));
        });
      });
    },
  };
}

// The shop's pages: `/` is the checkout, `/recorder.html` the voice note.
export default defineConfig({
  root: fileURLToPath(new URL("web", import.meta.url)),
  plugins: [notesApi()],
});
