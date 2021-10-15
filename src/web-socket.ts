import { EventSrc, EvtListener, KeyOf, Unsubscriber } from '@nano-utils/evt-src';
import { Logger } from '@nano-utils/logger';
import { SocketMsg } from './types';

/**
 * A wrapper class around the web WebSocket API
 */
export class Socket<IM extends { [K in IT]: SocketMsg<K> }, OM extends { [K in OT]: SocketMsg<K> }, IT extends string = KeyOf<IM>, OT extends string = KeyOf<OM>> {
	private logger: Logger;
	private _socket: WebSocket;
	private msgQueue: OM[KeyOf<OM>][];
	private events: EventSrc<{ [K in KeyOf<IM>]: [IM[K]] }>;

	/**
	 * Creates a new Socket object with the underlying WebSocket connecting to ``url``
	 * @param url the url of the WebSocket server
	 */
	constructor(url: string);

	/**
	 * Creates a new Socket object with the underlying WebSocket as the given WebSocket
	 * @param socket the existing WebSocket
	 */
	constructor(socket: WebSocket);
	constructor(urlOrSocket: string | WebSocket) {
		if (typeof urlOrSocket === 'string') {
			const url = urlOrSocket.replace('http', 'ws');
			this._socket = new WebSocket(url);
			this.logger = new Logger(`${url} Socket`);
		} else {
			const socket = urlOrSocket;
			this._socket = socket;
			this.logger = new Logger(`${socket.url} Socket`);
		}
		this.msgQueue = [];
		this.events = new EventSrc();

		this._socket.addEventListener('open', () => {
			this.msgQueue.forEach((msg) => this._socket.send(JSON.stringify(msg)));
			this.msgQueue = [];
			this.logger.log('Socket Opened');
		});

		this._socket.addEventListener('message', (evt) => {
			const msg = JSON.parse(evt.data) as IM[KeyOf<IM>];
			this.events.dispatch(msg.type as KeyOf<IM>, msg);
		});

		this._socket.addEventListener('close', (evt) => {
			this.logger.log('Closed', evt);
		});
	}

	/**
	 * Sends the given message. If the socket is not open, will automatically queue it to be sent upon opening.
	 * @param msg the message to send
	 */
	public send<M extends KeyOf<OM>>(msg: OM[M]): void {
		if (this._socket.readyState === WebSocket.CONNECTING) {
			this.msgQueue.push(msg);
		} else if (this._socket.readyState === WebSocket.OPEN) {
			this._socket.send(JSON.stringify(msg));
		}
	}

	/**
	 * Attaches the given listener to listen for the given event
	 * @param msgType the type of the message to listen for
	 * @param listener the callback to be called
	 * @returns a function that will remove the listener upon call
	 */
	public on<M extends KeyOf<IM>>(msgType: M, listener: EvtListener<[IM[M]]>): Unsubscriber {
		return this.events.on<M>(msgType, listener);
	}

	/**
	 * Attaches the given listener to listen for the given event, but will automatically remove it after 1 call
	 * @param msgType the type of the message to listen for
	 * @param listener the callback to be called
	 * @returns a function that will remove the listener upon call
	 */
	public once<M extends KeyOf<IM>>(msgType: M, listener: EvtListener<[IM[M]]>): Unsubscriber {
		const unsubscribe = this.events.on<M>(msgType, (msg: IM[M]) => {
			listener(msg);
			unsubscribe();
		});

		return unsubscribe;
	}

	/**
	 * Used to wait for the next message of the given type using async/await
	 * @param msgType the type of the message to wait for
	 * @returns a promise that resolves with the next message received of the given type, when it is received
	 */
	public async await<M extends KeyOf<IM>>(msgType: M): Promise<IM[M]> {
		return new Promise((resolve) => {
			this.once(msgType, (msg) => resolve(msg));
		});
	}

	/**
	 * Closes the socket
	 */
	public close(): void {
		this._socket.close();
	}
}
