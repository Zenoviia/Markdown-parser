#!/usr/bin/env node
const { createServer } = require("./server");

const port = process.env.PORT || 3000;

const app = createServer();

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

module.exports = server;
