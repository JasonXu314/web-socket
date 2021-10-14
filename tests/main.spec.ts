import 'websocket-polyfill';
import { WebSocketServer } from 'ws';
import { Socket } from '../src';

const wss = new WebSocketServer({ port: 5000 });

wss.on('connection', (socket) => {
	socket.on('message', (data) => {
		socket.send(data);
	});
});

let socket: Socket<SocketMsgs, SocketMsgs>;

type SocketMsgs = {
	TEST: { type: 'TEST'; test: string };
	TEST_2: { type: 'TEST_2'; test2: string };
};

console.log = () => {};

describe('Main test suite', () => {
	it('Should construct properly', () => {
		socket = new Socket<SocketMsgs, SocketMsgs>('ws://localhost:5000');

		expect(socket).toBeDefined();
	});

	it('Should send & receive properly', () => {
		socket = new Socket<SocketMsgs, SocketMsgs>('ws://localhost:5000');
		const listener = jest.fn(() => {});

		socket.on('TEST', listener);

		socket.send({ type: 'TEST', test: 'hi' });

		socket.on('TEST', () => {
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith({ type: 'TEST', test: 'hi' });
		});
	});

	it('Should remove listener after 1 call', () => {
		socket = new Socket<SocketMsgs, SocketMsgs>('ws://localhost:5000');
		const listener = jest.fn(() => {});

		socket.once('TEST', listener);

		socket.send({ type: 'TEST', test: 'hi' });

		socket.on('TEST', () => {
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith({ type: 'TEST', test: 'hi' });

			socket.send({ type: 'TEST', test: 'hi' });

			socket.on('TEST', () => {
				expect(listener).toHaveBeenCalledTimes(1);
			});
		});
	});

	it('Should send & receive different messages properly', async () => {
		socket = new Socket<SocketMsgs, SocketMsgs>('ws://localhost:5000');
		const l1 = jest.fn(() => {});
		const l2 = jest.fn(() => {});

		socket.on('TEST', l1);
		socket.on('TEST_2', l2);

		socket.send({ type: 'TEST', test: 'hi' });

		await socket.await('TEST');

		expect(l1).toHaveBeenCalledTimes(1);
		expect(l1).toHaveBeenCalledWith({ type: 'TEST', test: 'hi' });
		expect(l2).toHaveBeenCalledTimes(0);

		socket.send({ type: 'TEST_2', test2: 'hi' });

		await socket.await('TEST_2');

		expect(l1).toHaveBeenCalledTimes(1);
		expect(l2).toHaveBeenCalledTimes(1);
		expect(l2).toHaveBeenCalledWith({ type: 'TEST_2', test2: 'hi' });
	});

	it('Should remove message listeners properly', async () => {
		socket = new Socket<SocketMsgs, SocketMsgs>('ws://localhost:5000');
		const l1 = jest.fn(() => {});
		const l2 = jest.fn(() => {});
		const l3 = jest.fn(() => {});

		socket.on('TEST', l1);
		socket.once('TEST_2', l2);

		socket.send({ type: 'TEST', test: 'hi' });

		await socket.await('TEST');

		expect(l1).toHaveBeenCalledTimes(1);
		expect(l1).toHaveBeenCalledWith({ type: 'TEST', test: 'hi' });
		expect(l2).toHaveBeenCalledTimes(0);

		socket.send({ type: 'TEST_2', test2: 'hi' });

		await socket.await('TEST_2');

		expect(l1).toHaveBeenCalledTimes(1);
		expect(l2).toHaveBeenCalledTimes(1);
		expect(l2).toHaveBeenCalledWith({ type: 'TEST_2', test2: 'hi' });
		expect(l3).toHaveBeenCalledTimes(0);

		socket.on('TEST_2', l3);

		socket.send({ type: 'TEST_2', test2: 'hi' });

		await socket.await('TEST_2');

		expect(l1).toHaveBeenCalledTimes(1);
		expect(l2).toHaveBeenCalledTimes(1);
		expect(l3).toHaveBeenCalledTimes(1);
		expect(l3).toHaveBeenCalledWith({ type: 'TEST_2', test2: 'hi' });
	});
});

afterEach((done) => {
	if ((socket as any)._socket.readyState === WebSocket.OPEN) {
		socket.close();
		(socket as any)._socket.onclose = () => {
			done();
		};
	} else {
		(socket as any)._socket.onopen = () => {
			socket.close();
			(socket as any)._socket.onclose = () => {
				done();
			};
		};
	}
});

afterAll(() => {
	wss.close();
});
