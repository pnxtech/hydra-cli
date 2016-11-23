# hydra-cli
Hydra command line interface for use with [Hydra](https://github.com/flywheelsports/fwsp-hydra) enabled microservices.

## install

```shell
$ [sudo] npm install -g hydra-cli
```

## Command overview

```
$ hydra-cli
hydra-cli version 0.3.0
Usage: hydra-cli command [parameters]
See docs at: https://github.com/flywheelsports/hydra-cli

A command line interface for Hydra services

Commands:
  help                        - this help list
  config                      - configure connection to redis
  config list                 - display current configuration
  health [serviceName]        - display service health
  healthlog serviceName       - display service health log
  message create              - create a message object
  message send message.json   - send a message
  nodes [serviceName]         - display service instance nodes
  rest path [payload.json]    - make an HTTP RESTful call to a service
  routes [serviceName]        - display service API routes
  services [serviceName]      - display list of servers
```

## help
Lists the help screen above.
> syntax: hydra-cli config list
```shell
$ hydra-cli
```

## config

Hydra-cli requires that you first point it to the instance of Redis which your microservices are using.

```shell
$ hydra-cli config
redisUrl: 127.0.0.1
redisPort: 6379
redisDb: 15
```

## config list
Lists your config settings.

```javascript
$ hydra-cli config list
{
  "version": "1.0",
  "redisUrl": "127.0.0.1",
  "redisPort": "6379",
  "redisDb": "15"
}
```

## health
The health command displays the health of services which are currently running.
If you specify the name of a service than only that service is displayed.

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

```shell
$ hydra-cli healthlog red-service
fatal | 2016-11-22T16:51:58.609Z PID:12664: Port 6000 is already in use
```

## message create
The `message create` command will create a UMF message which you can customize for use with the `message send` command.

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

The `message send` command sends a message to a service. Use the `message create` command to create a message and place it in a file, such as message.json.

```shell
$ hydra-cli message send message.json
```

## nodes

Displays a list of services instances (called nodes). If you specify a serviceName then only service instances with that name will be displayed.

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

## rest
The `rest` command allows you to make a RESTful API call to a service which exposes HTTP endpoints.

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
