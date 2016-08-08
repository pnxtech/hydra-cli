#!/usr/bin/env node
'use strict';

const fs = require('fs');
const rl = require("readline");
const moment = require('moment');

class Program {
  constructor() {
    this.configData = null;
    this.hydraConfig = null;
  }

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

  _getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }

  main() {
    if (process.argv.length < 3) {
      this.displayHelp();
      process.exit();
      return;
    }

    this.hydraConfig = `${this._getUserHome()}/.hydra-cli`;
    fs.readFile(this.hydraConfig, 'utf8', (err, data) => {
      if (!err) {
        try {
          this.configData = JSON.parse(data);
        } catch (e) {
          this.configData = null;
        }
      }

      let command = process.argv[2];
      let args = process.argv.slice(3);

      switch (command) {
        case 'config':
          this.handleConfigCommand(args);
          break;
      }
    });
  }

  handleConfigCommand(args) {
    let prompts = rl.createInterface(process.stdin, process.stdout);
    prompts.question('redisUrl: ', (redisUrl) => {
      prompts.question('redisPort: ', (redisPort) => {
        prompts.question('redisDb: ', (redisDb) => {
          let data = this.configData || {};
          data.redisUrl = redisUrl;
          data.redisPort = redisPort;
          data.redisDb = redisDb;
          fs.writeFile(this.hydraConfig, JSON.stringify(data), (err) => {
            if (err) {
              console.log(err);
            }
            process.exit();
          });
        });
      });
    });
  }
}

new Program().main();
