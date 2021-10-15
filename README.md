## Description

A lightweight wrapper library around the native WebSocket API

## Installation

```
npm i @nano-utils/web-socket
```

or

```
yarn add @nano-utils/web-socket
```

## Usage

```js
import { Socket } from '@nano-utils/web-socket';

const socket = new Socket('wss://example.com');

socket.on('MY_MESSAGE', (msg) => {
	console.log(`Type: ${msg.type}, Foo: ${msg.foo}`); // Type: MY_MESSAGE, Foo: something
});
```

With Typescript:

```ts
import { Socket } from '@nano-utils/web-socket';

type Msgs = {
	MY_MESSAGE: { type: 'MY_MESSAGE'; foo: string };
};

const socket = new Socket<Msgs, {}>('wss://example.com'); // second type parameter is for outgoing messages

socket.on('MY_MESSAGE', (msg) => {
	console.log(`Type: ${msg.type}, Foo: ${msg.foo}`); // Type: MY_MESSAGE, Foo: something
});
```

Sending Messages:

```ts
import { Socket } from '@nano-utils/web-socket';

type IMsgs = {
	MY_MESSAGE: { type: 'MY_MESSAGE'; foo: string };
};

type OMsgs = {
	MY_OUTGOING_MESSAGE: { type: 'MY_OUTGOING_MESSAGE'; foo: string };
};

const socket = new Socket<IMsgs, OMsgs>('wss://example.com');

socket.send({ type: 'MY_OUTGOING_MESSAGE', foo: 'bar' }); // Waiting for the socket to be open is automatically handled
```

Awaiting Messages:

```ts
import { Socket } from '@nano-utils/web-socket';

type IMsgs = {
	MY_MESSAGE: { type: 'MY_MESSAGE'; foo: string };
};

const socket = new Socket<IMsgs, {}>('wss://example.com');

async function myFunc() {
	await socket.await('MY_MESSAGE');
	console.log('Received message');
}

async function myFunc2() {
	const msg = socket.await('MY_MESSAGE');
	console.log('Received message', msg);
}
```

## Usage Notes:

-   Each message (both outgoing and incoming) must have a type property, which is litstened to in the `on` method
-   If using typescript, each message's key in the message type map must match the type property of the message
-   This package is designed to be paired with the [server-sockets](https://npmjs.org/packages/@nano-utils/server-sockets) library on the backend, but any server that sends messages in json format with type properties will work
