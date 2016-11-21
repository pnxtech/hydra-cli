# hydra-cli
Hydra command line interface for use with [Hydra](https://github.com/flywheelsports/fwsp-hydra) enabled microservices.

#### install

```shell
$ sudo npm install -g hydra-cli
```

#### Commands

```
hydra-cli version 0.2.0
Usage: hydra-cli command [parameters]
See docs at: https://github.com/flywheelsports/hydra-cli

A command line interface for Hydra services

Commands:
  help                        - this help list
  config                      - configure connection to redis
  config list                 - display current configuration
  message create              - create a message object
  message send [message.json] - send a message
  nodes                       - same as nodes lists
  nodes list [serviceName]    - display service instance nodes
  nodes remove id             - remove a service from nodes list
  rest path [payload.json]    - make an HTTP RESTful call to a service
  routes [serviceName]        - display service API routes
  healthlog serviceName       - display service health log
```


#### Config

Hydra-cli requires that you first point it to the instance of Redis which your microservices are using.

```
$ hydra-cli config
```
