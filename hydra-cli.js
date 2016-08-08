#!/usr/bin/env node
'use strict';

const fs = require('fs');
const moment = require('moment');

class Program {
  displayHelp() {
    console.log('Usage: hydra-cli command [parameters]');
    console.log('');
    console.log('A command line interface for Hydra services');
    console.log('');
    console.log('Commands:');
    console.log('  config   configure connection to redis');
    console.log('  nodes    display service instance nodes');
    console.log('  routes   display service API routes');
  }

  main() {
    if (process.argv.length < 3) {
      this.displayHelp();
      process.exit();
    }
  }
}

new Program().main();
