import { Socket, createServer } from "net";
import { EventEmitter } from "events";

export interface IClient {
	id: string;
	socket: Socket;
};

export class ClientPool extends EventEmitter {
	constructor(port?: number, host?: string) {
		super();
		createServer((socket) => {
			let clientid = `${socket.remoteAddress}:${socket.remotePort}`;
			if (!this.clients[clientid]) {
				this.clients[clientid] = socket;
				this.emit("connect", ++this.clientCount);
			};
			socket.on("close", () => {
				if (this.clients[clientid]) {
					delete this.clients[clientid];
					this.emit("disconnect", --this.clientCount);
				};
			});
		}).listen({
			port: port || 64000,
			host: host || "192.168.1.64",
		}).on("listening", () => {
			console.log(`Server listening on ${host || "192.168.1.64"}:${port || 64000} `)
		})
	}
	private clientCount = 0;
	private clients: any = {};
	public getClient(clientid?: string): IClient | IClient[] | null {
		if (clientid) {
			for (let c in this.clients) {
				if (c === clientid)
					return <IClient>{
						id: c,
						socket: this.clients[c],
					};
			};
			return null;
		}
		else {
			let _clients: IClient[] = [];
			for (let c in this.clients) {
				_clients.push(<IClient>{ id: c, socket: this.clients[c] });
			};
			return _clients;
		};
	};
};