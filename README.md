# hydra-cli

[![npm version](https://badge.fury.io/js/hydra-cli.svg)](https://badge.fury.io/js/hydra-cli) <span class="badge-npmdownloads"><a href="https://npmjs.org/package/hydra-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/hydra-cli.svg" alt="NPM downloads" /></a></span> [![npm](https://img.shields.io/npm/l/hydra-cli.svg)]()

Hydra command line interface for use with [Hydra](https://github.com/flywheelsports/hydra) enabled microservices.

## install

```shell
$ [sudo] npm install -g hydra-cli
```

## Command overview

```
hydra-cli version 1.8.0
Usage: hydra-cli command [parameters]
See docs at: https://github.com/flywheelsports/hydra-cli

A command line interface for Hydra services

Commands:
  help                         - this help list
  cfg list serviceName         - display a list of config versions
  cfg pull label               - download configuration file
  cfg push label filename      - update configuration file
  cfg remove label             - remove a configuration version
  config instanceName          - configure connection to redis
  config list                  - display current configuration
  use instanceName             - name of redis instance to use
  health [serviceName]         - display service health
  healthlog serviceName        - display service health log
  message create               - create a message object
  message send message.json    - send a message
  message queue message.json   - queue a message
  nodes [serviceName]          - display service instance nodes
  redis info                   - display redis info
  refresh node list            - refresh list of nodes
  rest path [payload.json]     - make an HTTP RESTful call to a service
  routes [serviceName]         - display service API routes
  services [serviceName]       - display list of services
  shell                        - display command to open redis shell
```

## help
Lists the help screen above.

> syntax: hydra-cli help

```shell
$ hydra-cli help
```

## cfg

Hydra-cli allows you to push and pull configurations for your microservices.

In this example we're pushing the config.json file from the local directory and storing it in Redis under the myservice:0.0.1 key. This allows the `myservice` service to pull its 0.0.1 configuration during startup.

```shell
$ hydra-cli cfg push myservice:0.0.1 config.json
```

We can download the configuration file for the myservice using:

```shell
$ hydra-cli cfg pull myservice:0.0.1 > config.json
```

Because the `cfg pull` command outputs the contents to screen you'll need to use the standard out redirection to copy the output to a file.

You can retrieve a list of config versions for a given service using:

```shell
$ hydra-cli cfg list myservice
```

To remove an entry, use:

```shell
$ hydra-cli cfg remove myservice:0.0.1
```

## config

Hydra-cli requires that you first point it to the instance of Redis which your microservices are using.
You must name the instance you're configuring.

> syntax: hydra-cli config instanceName

```shell
$ hydra-cli config local
redisUrl: 127.0.0.1
redisPort: 6379
redisDb: 15
```

## config list
Lists your config settings.

> syntax: hydra-cli config list

```javascript
$ hydra-cli config list
{
  "version": 2,
  "local": {
    "redisUrl": "127.0.0.1",
    "redisPort": "6379",
    "redisDb": "15"
  }
}
```

## use
Specify which redis instance to use.

```javascript
$ hydra-cli use local
```

## health
The health command displays the health of services which are currently running.
If you specify the name of a service than only that service is displayed.

> syntax: hydra-cli health [serviceName]

> serviceName is optional

```javascript
$ hydra-cli health
[
  [
    {
      "updatedOn": "2016-11-22T18:01:49.637Z",
      "serviceName": "hello-service",
      "instanceID": "2c87057963121e1d7983bc952951ff3f",
      "sampledOn": "2016-11-22T18:01:49.637Z",
      "processID": 54906,
      "architecture": "x64",
      "platform": "darwin",
      "nodeVersion": "v6.8.1",
      "memory": {
        "rss": 41324544,
        "heapTotal": 24154112,
        "heapUsed": 20650296
      },
      "uptime": "2 hours, 58 minutes, 27.68 seconds",
      "uptimeSeconds": 10707.68,
      "usedDiskSpace": "53%"
    }
  ],
  [
    {
      "updatedOn": "2016-11-22T18:01:50.323Z",
      "serviceName": "red-service",
      "instanceID": "ce62591552a8b304d7236c820d0a4859",
      "sampledOn": "2016-11-22T18:01:50.323Z",
      "processID": 13431,
      "architecture": "x64",
      "platform": "darwin",
      "nodeVersion": "v6.8.1",
      "memory": {
        "rss": 45961216,
        "heapTotal": 26251264,
        "heapUsed": 20627944
      },
      "uptime": "1 hour, 9 minutes, 19.038999999999536 seconds",
      "uptimeSeconds": 4159.039,
      "usedDiskSpace": "53%"
    }
  ]
]
```

## healthlog
Displays internal log for a service. The serviceName is required.

> syntax: hydra-cli healthlog serviceName

> serviceName is required

```shell
$ hydra-cli healthlog red-service
fatal | 2016-11-22T16:51:58.609Z PID:12664: Port 6000 is already in use
```

## message create
The `message create` command will create a [UMF](https://github.com/cjus/umf) message which you can customize for use with the `message send` command.

> syntax: hydra-cli message create

```shell
$ hydra-cli message create
{
  "to": "{serviceName here}:/",
  "from": "hydra-cli:/",
  "mid": "378572ab-3cd3-414b-b56f-3d2bbf089c19",
  "timestamp": "2016-11-22T18:14:49.441Z",
  "version": "UMF/1.4.3",
  "body": {}
}
```

Just edit the to field with the name of the service you'd like to send a message to.

## message send

> syntax: hydra-cli send message.json

> message.json is the name of a file containing JSON which you wish to send.  This field is required.

The `message send` command sends a [UMF](https://github.com/cjus/umf) fomatted message to a service. Use the `message create` command to create a message and place it in a file, such as message.json.

```shell
$ hydra-cli message send message.json
```

## message queue

```shell
$ hydra-cli message queue message.json
```

Like send message but the message is pushed on the a service's queue rather then sent directly to a service.

## nodes

Displays a list of services instances (called nodes). If you specify a serviceName then only service instances with that name will be displayed.

> syntax: hydra-cli nodes [serviceName]

> serviceName is optional

```javascript
$ hydra-cli nodes
[
  {
    "serviceName": "red-service",
    "serviceDescription": "red stuff",
    "version": "0.0.1",
    "instanceID": "6b8eacc1ead3e1f904647110ce8c092f",
    "updatedOn": "2016-11-22T18:19:04.377Z",
    "processID": 3801,
    "ip": "10.1.1.163",
    "port": 6000,
    "elapsed": 3
  },
  {
    "serviceName": "hello-service",
    "serviceDescription": "Hello service demo",
    "version": "not specified",
    "instanceID": "2c87057963121e1d7983bc952951ff3f",
    "updatedOn": "2016-11-22T18:19:02.943Z",
    "processID": 54906,
    "ip": "192.168.1.186",
    "port": 3000,
    "elapsed": 4
  }
]
```

## redis
You can pull Redis runtime info using:

```shell
$ hydra-cli redis info
# Server
redis_version:3.0.7
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:9608eaf6bab769c5
redis_mode:standalone
os:Linux 4.9.49-moby x86_64
arch_bits:64
multiplexing_api:epoll
gcc_version:4.9.2
...
```

## refresh
Refresh clears dead services from the nodes list.  Use this when `hydra-cli nodes` returns nodes which have expired.

```javascript
$ hydra-cli refresh node list
```

## rest
The `rest` command allows you to make a RESTful API call to a service which exposes HTTP endpoints.

> syntax: hydra-cli rest path [payload.json]

> payload is a file containing JSON which you wish to send with POST and PUT calls.

Note the use of the path `hello-service:[get]/` below. This format is required.
The full format is: `{serviceID}@{serviceName}:{HTTP method get/post/put/delete etc...}{API path}

This is an example of how you would call an API endpoint on a specific service instance:

```
$ hydra-cli rest a921a00de7caf9103a0d96346b3a61f8@hello-service:[get]/v1/hello/greeting
```

You may supply a file to upload when using `post` and `put` HTTP calls.

> You can locate a service's instance using the `hydra-cli nodes` command.

```javascript
$ hydra-cli rest hello-service:[get]/
{
  "headers": {
    "access-control-allow-origin": "*",
    "x-process-id": "44032",
    "x-dns-prefetch-control": "off",
    "x-frame-options": "SAMEORIGIN",
    "x-download-options": "noopen",
    "x-content-type-options": "nosniff",
    "x-xss-protection": "1; mode=block",
    "x-powered-by": "hello-service/0.11.4",
    "content-type": "text/html; charset=utf-8",
    "content-length": "59",
    "etag": "W/\"3b-Kwmf5A3/0YsqP+L3cGK3eg\"",
    "x-response-time": "17.750ms",
    "date": "Tue, 22 Nov 2016 19:09:51 GMT",
    "connection": "close"
  },
  "body": "hello from hello-service - a921a00de7caf9103a0d96346b3a61f8",
  "statusCode": 200
}
```

If you forget to specify an HTTP type then you'll see a response like this one:

```javascript
$ hydra-cli rest hello-service:/
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "statusDescription": "Request is invalid, missing parameters?",
  "result": {
    "reason": "HTTP method not specified in `to` field"
  }
}
```

## routes
The routes command will display routes which services register via hydra-express or via the use of the hydra.registerRoute call.

> syntax: hydra-cli routes

```javascript
$ hydra-cli routes
{
  "hello-service": [
    "[GET]/_config/hello-service",
    "[get]/"
  ]
}
```

## services

Display a list of registered services.

> syntax: hydra-cli services

```javascript
$ hydra-cli services
[
  {
    "serviceName": "hello-service",
    "type": "demo",
    "registeredOn": "2016-11-22T19:09:47.772Z"
  },
  {
    "serviceName": "red-service",
    "type": "red",
    "registeredOn": "2016-11-22T19:31:31.061Z"
  },
  {
    "serviceName": "blue-service",
    "type": "blue",
    "registeredOn": "2016-11-22T19:31:27.853Z"
  }
]
```

## shell

Display command used to open a redis shell using redis-cli. On *nix machines you can use the following to quickly open a redis shell:

```shell
$ $(hydra-cli shell)
52.3.229.252:6379[15]>
```
