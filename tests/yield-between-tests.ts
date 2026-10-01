import { afterEach } from 'vitest';

// Vitest yields only microtasks between tests, so the worker never reads the
// replies to its `onTaskUpdate` calls until a test file is done. A file of
// synchronous tests that each build TypeScript programs can run past the
// 60 s RPC timeout under full-suite load, and the run then fails with
// `Timeout calling "onTaskUpdate"` although every test passed. One
// macrotask per test lets the replies through.
afterEach(() => new Promise<void>((resolve) => setImmediate(resolve)));
