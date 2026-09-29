import { preview } from 'astro';

/** Serves dist/ with Astro's preview server for the duration of fn(baseUrl), then stops it. */
export async function withPreview(fn, port = 4321) {
  // In-process server (Astro's JS API): stop() reliably shuts it down, unlike
  // the CLI, whose launcher hands the server to a separate process and exits.
  const server = await preview({ root: process.cwd(), server: { port }, logLevel: 'error' });
  try {
    return await fn(`http://localhost:${server.port}`);
  } finally {
    await server.stop();
  }
}
