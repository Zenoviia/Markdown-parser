#!/usr/bin/env node

/**
 * CLI Entry Point
 */

const CLI = require("../src/cli");

const cli = new CLI();
cli.run(process.argv);
