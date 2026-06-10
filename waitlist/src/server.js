import { app } from './app.js';
import { init } from './db.js';

const PORT = process.env.PORT || 8080;

// Defense-in-depth: even with the error middleware, never let a stray rejection
// or exception take the process down silently — log and keep serving.
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err?.message);
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`waitlist listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('fatal: db init failed:', err.message);
    process.exit(1);
  });
