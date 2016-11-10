#!/usr/bin/env node
'use strict';

const fs = require('fs');
const rl = require('readline');
const Promise = require('bluebird');
const moment = require('moment');
const redis = require('redis');
const Utils = require('fwsp-jsutils');
const version = require('./package.json').version;
const redisPreKey = 'hydra:service';

class Program {
  constructor() {
    this.configData = null;
    this.hydraConfig = null;
    this.redisdb = null;
  }

  /**
  * @name displayHelp
  * @description Display program help info
  */
  displayHelp() {
    console.log(`hydra-cli version ${version}`);
    console.log('Usage: hydra-cli command [parameters]');
    console.log('');
    console.log('A command line interface for Hydra services');
    console.log('');
    console.log('Commands:');
    console.log('  help                       - this help list');
    console.log('  config                     - configure connection to redis');
    console.log('  nodes                      - same as nodes lists');
    console.log('  nodes list [serviceName]   - display service instance nodes');
    console.log('  nodes remove id            - remove a service from nodes list');
    console.log('  routes [serviceName]       - display service API routes');
    console.log('  healthlog serviceName      - display service health log');
  }

  /**
  * @name getUserHome
  * @description Retrieve user's home directory
  * @return {string} - user's home directory path
  */
  getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }

  /**
  * @name main
  * @description entry point for command dispatch processing
  */
  main() {
    if (process.argv.length < 3) {
      this.displayHelp();
      process.exit();
      return;
    }

    this.hydraConfig = `${this.getUserHome()}/.hydra-cli`;
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
        case 'nodes':
          switch (args[0]) {
            case 'list':
              this.handleNodesList(args);
              break;
            case 'remove':
              this.handleNodesRemove(args);
              break;
            default:
              if (args.length === 0) {
                this.handleNodesList(args);
              } else {
                console.log(`Unknown nodes options: ${args[0]}`);
                this.exitApp();
              }
              break;
          }
          break;
        case 'routes':
          this.handleRoutes(args);
          break;
        case 'healthlog':
          this.handleHealthLog(args);
          break;
      }
    });
  }

  /**
  * @name redisConnect
  * @description Connect to an instance of redis. This is the redis db that Hydra is using
  * @return {object} promise - promise resolving
  */
  redisConnect() {
    return new Promise((resolve, reject) => {
      let redisdb = redis.createClient(this.configData.redisPort, this.configData.redisUrl);
      redisdb.select(this.configData.redisDb, (err, result) => {
        this.redisdb = redisdb;
        resolve();
      });
    });
  }

  /**
  * @name exitApp
  * @description properly exit this app
  */
  exitApp() {
    if (this.redisdb) {
      this.redisdb.quit();
    }
    console.log(' ');
    process.exit();
  }

  /**
  * @name getKeys
  * @summary Retrieves a list of redis keys based on pattern.
  * @param {string} pattern - pattern to filter with
  * @return {object} promise - promise resolving to array of keys or or empty array
  */
  getKeys(pattern) {
    return new Promise((resolve, reject) => {
      this.redisdb.keys(pattern, (err, result) => {
        if (err) {
          resolve([]);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
  * @name getRoutes
  * @summary Retrieves a array list of routes
  * @param {string} serviceName - name of service to retreieve list of routes.
  *                 If param is undefined, then the current serviceName is used.
  * @return {object} Promise - resolving to array of routes or rejection
  */
  getRoutes(serviceName) {
    return new Promise((resolve, reject) => {
      let routesKey = `${redisPreKey}:${serviceName}:service:routes`;
      this.redisdb.smembers(routesKey, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /* ************************************************************************* */
  /* ************************************************************************* */
  /* ************************************************************************* */
  /* ************************************************************************* */

  /**
  * @name handleConfigCommand
  * @description handle the creation of the app config DOT file.
  * @param {array} args - program arguments
  */
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

  /**
  * @name handleNodesList
  * @description handle the display of service nodes.
  * @param {array} args - program arguments
  */
  handleNodesList(args) {
    this.redisConnect()
      .then(() => {
        let now = moment.now();
        this.redisdb.hgetall(`${redisPreKey}:nodes`, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            let nodes = [];
            Object.keys(data).forEach((entry) => {
              let item = Utils.safeJSONParse(data[entry]);
              if ((args.length === 0 || args.length === 1) || (args.length === 2 && item.serviceName.indexOf(args[1]) > -1)) {
                item.elapsed = parseInt(moment.duration(now - moment(item.updatedOn)) / 1000);
                nodes.push(item);
              }
            });
            console.log(JSON.stringify(nodes, null, 2));
          }
          this.exitApp();
        });
      });
  }

  /**
  * @name handleNodesRemove
  * @description handle the removal of service node data.
  * @param {array} args - program arguments
  */
  handleNodesRemove(args) {
    if (args.length !== 2) {
      console.log('Missing parameter id');
      this.exitApp();
    }
    this.redisConnect()
      .then(() => {
        this.redisdb.hdel(`${redisPreKey}:nodes`, args[1], (err, data) => {
          if (err) {
            console.log(err);
          } else {
            console.log(`nodes entry ${args[1]} removed`);
          }
          this.exitApp();
        });
      });
  }

  /**
  * @name handleRoutes
  * @description handle the display of service routes
  * @param {array} args - program arguments
  */
  handleRoutes(args) {
    this.redisConnect()
      .then(() => {
        let promises = [];
        let serviceNames = [];
        this.getKeys('*:routes')
          .then((serviceRoutes) => {
            serviceRoutes.forEach((service) => {
              let segments = service.split(':');
              let serviceName = segments[2];
              if (args.length === 0 || (args.length === 1 && serviceName.indexOf(args[0]) > -1)) {
                serviceNames.push(serviceName);
                promises.push(this.getRoutes(serviceName));
              }
            });
            return Promise.all(promises);
          })
          .then((routes) => {
            let resObj = {};
            let idx = 0;
            routes.forEach((routesList) => {
              resObj[serviceNames[idx]] = routesList;
              idx += 1;
            });
            console.log(JSON.stringify(resObj, null, 2));
            this.exitApp();
          })
          .catch((err) => {
            console.log(err);
            this.exitApp();
          });
      });
  }

  /**
  * @name handleHealthLog
  * @description display service health log
  * @param {array} args - program arguments
  */
  handleHealthLog(args) {
    this.redisConnect()
      .then(() => {
        this.getKeys(`*:${args[0]}:*:health:log`)
          .then((instances) => {
            if (instances.length === 0) {
              console.log('[]');
              this.exitApp();
              return;
            }
            let trans = this.redisdb.multi();
            instances.forEach((instance) => {
              trans.lrange(instance, 0, 100);
            });
            trans.exec((err, result) => {
              if (err) {
                console.log(err);
              } else {
                let response = [];
                if (result || result.length > 0) {
                  result = result[0];
                  result.forEach((entry) => {
                    response.push(Utils.safeJSONParse(entry));
                  });
                }
                console.log(JSON.stringify(response, null, 2));
              }
              this.exitApp();
            });
          });
      });
  }
}

new Program().main();
