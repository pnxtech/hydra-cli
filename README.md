# hydra-cli
Hydra command line interface for use with [Hydra](https://github.com/flywheelsports/fwsp-hydra) enabled microservices.

#### install

```shell
$ sudo npm install -g hydra-cli
```

#### Commands

```shell
hydra-cli version 0.0.1
Usage: hydra-cli command [parameters]

A command line interface for Hydra services

Commands:
  help                       - this help list
  config                     - configure connection to redis
  nodes                      - same as nodes lists
  nodes list [serviceName]   - display service instance nodes
  nodes remove id            - remove a service from nodes list
  routes [serviceName]       - display service API routes
  healthlog serviceName      - display service health log
```


#### Config

Hydra-cli requires that you first point it to the instance of Redis which your microservices are using.

```
$ hydra-cli config
```
