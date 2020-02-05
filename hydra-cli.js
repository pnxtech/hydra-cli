#!/usr/bin/env node
'use strict';

const version = require('./package.json').version;

const fs = require('fs');
const rl = require('readline');
const hydra = require('hydra');
const Utils = hydra.getUtilsHelper();
const config = hydra.getConfigHelper();
const UMFMessage = hydra.getUMFMessageHelper();

const CONFIG_FILE_VERSION = 2;

/**
 * @name Program
 */
class Program {
  /**
   * @name constructor
   */
  constructor() {
    this.configData = null;
    this.configName = '';
    this.hydraConfig = null;
  }

  /**
  * @name displayHelp
  * @description Display program help info
  * @return {undefined}
  */
  displayHelp() {
    console.log(`hydra-cli version ${version}`);
    console.log('Usage: hydra-cli command [parameters]');
    console.log('See docs at: https://github.com/flywheelsports/hydra-cli');
    console.log('');
    console.log('A command line interface for Hydra services');
    console.log('');
    console.log('Commands:');
    console.log('  help                         - this help list');
    console.log('  cfg list serviceName         - display a list of config versions');
    console.log('  cfg pull label               - download configuration file');
    console.log('  cfg push label filename      - update configuration file');
    console.log('  cfg remove label             - remove a configuration version');
    console.log('  config instanceName          - configure connection to redis');
    console.log('  config list                  - display current configuration');
    console.log('  use instanceName             - name of redis instance to use');
    console.log('  health [serviceName]         - display service health');
    console.log('  healthlog serviceName        - display service health log');
    console.log('  message create               - create a message object');
    console.log('  message send message.json    - send a message');
    console.log('  message queue message.json   - queue a message');
    console.log('  nodes [serviceName]          - display service instance nodes');
    console.log('  redis info                   - display redis info');
    console.log('  refresh node list            - refresh list of nodes');
    console.log('  rest path [payload.json]     - make an HTTP RESTful call to a service');
    console.log('  routes [serviceName]         - display service API routes');
    console.log('  services [serviceName]       - display list of services');
    console.log('  shell                        - display command to open redis shell');
    console.log('');
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
  * @return {undefined}
  */
  main() {
    if (process.argv.length < 3) {
      this.displayHelp();
      process.exit();
      return;
    }

    let command = process.argv[2];
    let args = process.argv.slice(3);

    this.hydraConfig = `${this.getUserHome()}/.hydra-cli`;
    fs.readFile(this.hydraConfig, 'utf8', (err, data) => {
      if (!err) {
        try {
          this.configData = JSON.parse(data);
          if (!this.configData.version) {
            this.configData = {
              version: CONFIG_FILE_VERSION
            };
          }
          if (command === 'use' || command === 'config') {
            this.processCommand(command, args);
            return;
          }
          let conf = {
            'hydra': {
              'serviceName': 'hydra-cli',
              'serviceDescription': 'Not a service',
              'serviceIP': '',
              'servicePort': 0,
              'serviceType': 'non',
              'redis': {
                'url': this.configData.redisUrl || '',
                'port': this.configData.redisPort || 0,
                'db': this.configData.redisDb || 0
              }
            }
          };
          if (this.configData.redisPassword && this.configData.redisPassword !== '') {
            conf.hydra.redis.password = this.configData.redisPassword;
          }

          let tid = setTimeout(() => {
            console.log('Unable to connect to Redis. Use "hydra-cli config list" or "hydra-cli use instanceName" to switch to another instance.');
            clearTimeout(tid);
            process.exit();
            return;
          }, 5000);

          hydra.init(conf)
            .then(() => {
              this.processCommand(command, args);
              return 0;
            })
            .catch((err) => {
              console.log('err', err.message);
              this.configData = null;
            });
        } catch (err) {
          console.log('err', err.message);
          this.configData = null;
          this.processCommand(command, args);
        }
      } else {
        this.configData = null;
        this.processCommand(command, args);
      }
    });
  }

  /**
  * @name processCommand
  * @description process hydra-cli command
  * @param {string} command - command string
  * @param {array} args - array of command params
  * @return {undefined}
  */
  processCommand(command, args) {
    if (!this.configData && command !== 'use' && command !== 'config') {
      console.log('Warning, hydra-cli is not configured.');
      console.log('Use the hydra-cli config command.');
      return;
    }

    switch (command) {
      case 'cfg':
        this.handleCfgCommand(args);
        break;
      case 'config':
        this.handleConfigCommand(args);
        break;
      case 'use':
        this.handleUseCommand(args);
        break;
      case 'health':
        this.handleHealth(args);
        break;
      case 'healthlog':
        this.handleHealthLog(args);
        break;
      case 'help':
        this.displayHelp();
        process.exit();
        break;
      case 'message':
        switch (args[0]) {
          case 'create':
            this.handleMessageCreate(args);
            break;
          case 'send':
            this.handleMessageSend(args);
            break;
          case 'queue':
            this.handleMessageQueue(args);
            break;
          default:
            console.log(`Unknown message options: ${args[0]}`);
            this.exitApp();
            break;
        }
        break;
      case 'nodes':
        this.handleNodesList(args);
        break;
      case 'refresh':
        this.handleRefresh(args);
        break;
      case 'redis':
        this.handleRedis(args);
        break;
      case 'rest':
        this.handleRest(args);
        break;
      case 'routes':
        this.handleRoutes(args);
        break;
      case 'services':
        this.handleServices(args);
        break;
      case 'shell':
        this.handleShell();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        this.exitApp();
        break;
    }
  }

  /**
  * @name exitApp
  * @description properly exit this app
  * @return {undefined}
  */
  exitApp() {
    setTimeout(() => {
      hydra.shutdown();
      process.exit();
    }, 250);
  }

  /**
  * @name displayJSON
  * @description pretty print json
  * @param {string} json - stringified json
  * @return {undefined}
  */
  displayJSON(json) {
    if (typeof json === 'string') {
      let js = Utils.safeJSONParse(json);
      if (!js) {
        console.log(json);
      } else {
        console.log(JSON.stringify(js, null, 2));
      }
    } else {
      console.log(JSON.stringify(json, null, 2));
    }
  }

  /* ************************************************************************* */
  /* ************************************************************************* */
  /* ************************************************************************* */
  /* ************************************************************************* */

  /**
  * @name handleCfgCommand
  * @description handle service config files
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleCfgCommand(args) {
    if (!args[0]) {
      console.log('requires "push" or "pull" options');
      this.exitApp();
    }

    if (args[0] === 'push') {
      if (args.length != 3) {
        console.log('cfg push requires a label and config filename');
        this.exitApp();
      }
      fs.readFile(args[2], 'utf8', (err, data) => {
        if (!err) {
          let strMessage = Utils.safeJSONParse(data);
          hydra.putConfig(args[1], strMessage)
            .then(() => {
              this.exitApp();
            })
            .catch((err) => {
              console.log(err.message);
              this.exitApp();
            });
        } else {
          console.log(`cfg push can't open file ${args[2]}`);
          this.exitApp();
        }
      });
    }

    if (args[0] === 'pull') {
      hydra.getConfig(args[1])
        .then((result) => {
          this.displayJSON(result);
          this.exitApp();
        })
        .catch((err) => {
          console.log(err.message);
          this.exitApp();
        });
    }

    if (args[0] === 'list') {
      hydra.listConfig(args[1])
        .then((result) => {
          result.forEach((item) => {
            console.log(item);
          });
          this.exitApp();
        })
        .catch((err) => {
          console.log(err.message);
          this.exitApp();
        });
    }

    if (args[0] === 'remove') {
      if (!args[1]) {
        console.log('Label is required.');
        this.exitApp();
        return;
      }
      let segs = args[1].split(':');
      if (segs.length !== 2) {
        console.log('Label format must be in serviceName:version format.');
        this.exitApp();
        return;
      }
      let redisClient = hydra.getClonedRedisClient();
      redisClient.hdel(`hydra:service:${segs[0]}:configs`, segs[1], (err, result) => {
        if (result > 0) {
          console.log(`Removed entry ${args[1]}`);
        } else {
          console.log(`Unable to locate entry for ${args[1]}`);
        }
        redisClient.quit();
        this.exitApp();
      });
    }
  }

  /**
  * @name handleConfigCommand
  * @description handle the creation of the app config DOT file.
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleConfigCommand(args) {
    if (args.length === 1 && args[0] === 'list') {
      console.log(JSON.stringify(this.configData, null, 2));
      process.exit();
      return;
    } else if (args.length !== 1) {
      console.log('An instance name is required.');
      process.exit();
      return;
    }

    this.configName = args[0];

    let prompts = rl.createInterface(process.stdin, process.stdout);
    prompts.question('redisUrl: ', (redisUrl) => {
      prompts.question('redisPort: ', (redisPort) => {
        prompts.question('redisDb: ', (redisDb) => {
          prompts.question('redisPassword (blank for null): ', (redisPassword)=>{
            let data = this.configData || {
              version: CONFIG_FILE_VERSION
            };
            Object.assign(data, {
              redisUrl,
              redisPort,
              redisDb,
              [this.configName]: {
                redisUrl,
                redisPort,
                redisDb
              }
            });
            if (redisPassword && redisPassword !== '') {
              data.redisPassword = redisPassword;
              data[this.configName].redisPassword = redisPassword;
            }
            fs.writeFile(this.hydraConfig, JSON.stringify(data), (err) => {
              if (err) {
                console.log(err.message);
              }
              process.exit();
            });
          });
        });
      });
    });
  }

  /**
  * @name handleUseCommand
  * @description handle the switching of configs
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleUseCommand(args) {
    if (args.length !== 1) {
      console.log('An instance name is required.');
      process.exit();
      return;
    }
    this.configName = args[0];
    if (!this.configData[this.configName]) {
      console.log('Instance name not found, create with hydra-cli config instanceName command.');
      process.exit();
      return;
    }

    this.configData = Object.assign(this.configData, this.configData[this.configName]);
    fs.writeFile(this.hydraConfig, JSON.stringify(this.configData), (err) => {
      if (err) {
        console.log(err.message);
      }
      process.exit();
    });
  }

  /**
  * @name handleHealth
  * @description display service health
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleHealth(args) {
    let serviceName = args[0];
    let entries = [];
    hydra.getServiceHealthAll()
      .then((services) => {
        services.forEach((service) => {
          if (serviceName && service.health.length > 0 && service.health[0].serviceName === serviceName) {
            entries.push(service.health);
          }
          if (!serviceName) {
            entries.push(service.health);
          }
        });
        this.displayJSON(entries);
        this.exitApp();
      });
  }

  /**
  * @name handleHealthLog
  * @description display service health log
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleHealthLog(args) {
    let serviceName = args[0];

    if (!serviceName) {
      console.log('Missing serviceName');
      this.exitApp();
      return;
    }

    hydra.getServiceHealthLog(serviceName)
      .then((logs) => {
        logs.forEach((entry) => {
          console.error(`${entry.type} | ${entry.ts} PID:${entry.processID}: ${entry.message}`);
        });
        this.exitApp();
      });
  }

  /**
  * @name handleMessageCreate
  * @description Display a new message
  * @param {array} _args - program arguments
  * @return {undefined}
  */
  handleMessageCreate(_args) {
    let msg = UMFMessage.createMessage({
      to: '{serviceName here}:/',
      from: 'hydra-cli:/',
      body: {}
    });
    this.displayJSON(msg);
    this.exitApp();
  }

  /**
  * @name handleMessageSend
  * @description Send message
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleMessageSend(args) {
    if (args.length !== 2) {
      console.log('Invalid number of parameters');
      this.exitApp();
      return;
    }
    config.init(args[1])
      .then(() => {
        hydra.sendMessage(config.getObject());
        this.exitApp();
        return null;
      })
      .catch((err) => {
        console.log(err.message);
        this.exitApp();
      });
  }

  /**
  * @name handleMessageQueue
  * @description Queue message
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleMessageQueue(args) {
    if (args.length !== 2) {
      console.log('Invalid number of parameters');
      this.exitApp();
      return;
    }
    config.init(args[1])
      .then(() => {
        hydra.queueMessage(config.getObject());
        this.exitApp();
        return null;
      })
      .catch((err) => {
        console.log(err.message);
        this.exitApp();
      });
  }

  /**
  * @name handleNodesList
  * @description handle the display of service nodes.
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleNodesList(args) {
    hydra.getServiceNodes()
      .then((nodes) => {
        let serviceList = [];
        let serviceName = args[0];
        if (serviceName) {
          nodes.forEach((service) => {
            if (serviceName === service.serviceName) {
              serviceList.push(service);
            }
          });
        } else {
          serviceList = nodes;
        }
        this.displayJSON(serviceList);
        this.exitApp();
      })
      .catch((err) => console.log(err));
  }

  /**
  * @name handleRedis
  * @description handle redis calls
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleRedis(args) {
    if (!args[0]) {
      console.log('requires "info" option');
      this.exitApp();
      return;
    }

    if (args[0] === 'info') {
      let redisClient = hydra.getClonedRedisClient();
      redisClient.info((err, result) => {
        if (!err) {
          console.log(`${result}`);
        } else {
          console.log(err);
        }
        redisClient.quit();
        this.exitApp();
      });
    }

    this.exitApp();
  }

  /**
  * @name handleRest
  * @description handle RESTful calls
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleRest(args) {
    let route = UMFMessage.parseRoute(args[0]);
    if (route.error) {
      console.log(`${route.error}`);
      this.exitApp();
      return;
    }
    let method = route.httpMethod || 'get';
    if ((method === 'get' || method === 'delete') && args.length > 1) {
      console.log(`Payload not allowed for HTTP '${method}' method`);
      this.exitApp();
      return;
    }
    if (args.length > 1) {
      config.init(args[1])
        .then(() => {
          let msg = UMFMessage.createMessage({
            to: `${args[0]}`,
            from: 'hydra-cli:/',
            headers: {
              'content-type': 'application/json'
            },
            body: config.getObject() || {}
          });
          hydra.makeAPIRequest(msg)
            .then((res) => {
              res.result = res.payLoad.toString('utf8');
              delete res.payLoad;
              this.displayJSON(res);
              this.exitApp();
            })
            .catch((err) => {
              console.log(err.message);
              this.exitApp();
            });
          return null;
        })
        .catch((_err) => {
          console.log(`Unable to open ${args[1]}`);
          this.exitApp();
        });
    } else {
      let msg = UMFMessage.createMessage({
        to: `${args[0]}`,
        from: 'hydra-cli:/',
        body: {}
      });
      hydra.makeAPIRequest(msg)
        .then((res) => {
          res.result = res.payLoad.toString('utf8');
          delete res.payLoad;
          this.displayJSON(res);
          this.exitApp();
        })
        .catch((err) => {
          console.log(err.message);
          this.exitApp();
        });
      return null;
    }
  }

  /**
  * @name handleRoutes
  * @description handle the display of service routes
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleRoutes(args) {
    hydra.getAllServiceRoutes()
      .then((routes) => {
        let serviceName = args[0];
        if (serviceName) {
          routes = {
            serviceName: routes[serviceName]
          };
        }
        this.displayJSON(routes);
        this.exitApp();
      })
      .catch((err) => console.log(err.message));
  }

  /**
  * @name handleServices
  * @description display list of services
  * @param {array} args - program arguments
  * @return {undefined}
  */
  handleServices(args) {
    hydra.getServices()
      .then((services) => {
        let serviceList = [];
        let serviceName = args[0];
        if (serviceName) {
          services.forEach((service) => {
            if (serviceName === service.serviceName) {
              serviceList.push(service);
            }
          });
        } else {
          serviceList = services;
        }
        this.displayJSON(serviceList);
        this.exitApp();
      })
      .catch((err) => console.log(err.message));
  }

  /**
  * @name handleRefresh
  * @description refresh list of nodes
  * @param {array} _args - program arguments
  * @return {undefined}
  */
  handleRefresh(_args) {
    hydra.getServiceNodes()
      .then((nodes) => {
        let ids = [];
        nodes.forEach((node) => {
          if (node.elapsed > 60) {
            ids.push(node.instanceID);
          }
        });
        if (ids.length) {
          let redisClient = hydra.getClonedRedisClient();
          redisClient.hdel('hydra:service:nodes', ids);
          redisClient.quit();
        }
        console.log(`${ids.length} entries removed`);
        this.exitApp();
      })
      .catch((err) => {
        console.log(err);
        this.exitApp();
      });
  }

  /**
  * @name handleShell
  * @summary displays the command used to open a redis shell for the currently selected instance
  * @return {undefined}
  */
  handleShell() {
    console.log(`redis-cli -h ${this.configData.redisUrl} -p ${this.configData.redisPort} -n ${this.configData.redisDb}`);
    this.exitApp();
  }
}

new Program().main();
