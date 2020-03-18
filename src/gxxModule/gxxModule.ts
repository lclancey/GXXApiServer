'use strict'

import { Socket } from "net";

type mtType = "MT_GSS" | "MT_GOM" | "MT_GTM" | "MT_GDI";
type cmdType = "CMD_INFO" | "CMD_READ" | "CMD_WRITEONE" | "CMD_WRITEMUL";
type dtType = "DT_PWM" | "DT_VOLT";

interface ICode {
	[key: string]: number,
}
interface IAlias {
	[key: number]: string,
}
const mtAlias: IAlias = {
	0x40: "MT_GSS", 0x41: "MT_GOM", 0x42: "MT_GTM", 0x43: "MT_GDI",
};
const mtCode: ICode = {
	"MT_GSS": 0x40, "MT_GOM": 0x41, "MT_GTM": 0x42, "MT_GDI": 0x43,
};
const cmdAlias: IAlias = {
	0x11: "CMD_INFO", 0x41: "CMD_READ", 0x42: "CMD_WRITEONE", 0x43: "CMD_WRITEMUL",
};
const cmdCode: ICode = {
	"CMD_INFO": 0x11, "CMD_READ": 0x41, "CMD_WRITEONE": 0x42, "CMD_WRITEMUL": 0x43,
};
const ptAlias: IAlias = {
	0x00: "PT_NONE", 0x01: "PT_SHT3x", 0x02: "PT_CCS811", 0x03: "PT_OPT3002", 0x0F: "PT_UNKNOW",
};
const ptCode: ICode = {
	"PT_NONE": 0x00, "PT_SHT3x": 0x01, "PT_CCS811": 0x02, "PT_OPT3002": 0x03, "PT_UNKNOW": 0x0F,
};
const dtAlias: IAlias = {
	0x00: "DT_PWM", 0x01: "DT_VOLT",
};
const dtCode: ICode = {
	"DT_PWM": 0x00, "DT_VOLT": 0x01,
};
const statusAlias: IAlias = {
	0: "success",
	100: "version not support",
	101: "server not ready",
	200: "no client",
	201: "no response",
	300: "command error",
	301: "response error",
};
const qryAlias: ICode = {
	"QRY_INFO": 0x11, "QRY_GTMREAD": 0x4241, "QRY_GTMWRITE": 0x4243,
};
const qryCode: IAlias = {
	0x11: "QRY_INFO", 0x4241: "QRY_GTMREAD", 0x4243: "QRY_GTMWRITE",
};

//API Request
export interface ReqValueGTMWrite {
	dimType: string,
	dimValue: number,
};
export interface ApiGXXReq {
	version: string,
	mtType: string;
	reqType: string,
	reqValue?: string | ReqValueGTMWrite[],
}

//API Response
export interface ResValueInfo {
	moduleType: string,
	buildTime: string,
};

export interface ResValueGTMRead {
	dimType: string,
	dimValue: number,
};

//API Help
export interface ApiHelp {

}
//-----------------------
export interface ApiGXXRes {
	version: string,
	resStatus: number,

	resValue?: ResValueInfo | ResValueGTMRead[] | null,
};

export abstract class Modules {
	private isProcessing: boolean = false;
	public isFaild: number = 0;
	public addCRC = (rawBuf: Buffer, isModbus: boolean = true): Buffer => {
		let resBuf: Buffer = Buffer.alloc(rawBuf.length + 2);
		let crcRes: number = rawBuf.reduce((pre, cur, i) => {
			resBuf[i] = cur;
			pre = (pre ^ cur);
			for (let i = 0; i < 8; i++) {
				if (pre & 0x0001)
					pre = (pre >> 1) ^ 0xA001;
				else
					pre = pre >> 1;
			}
			return pre;
		}, 0xFFFF);
		if (isModbus)
			resBuf.writeUInt16LE(crcRes, rawBuf.length);
		else
			resBuf.writeUInt16BE(crcRes, rawBuf.length);
		return resBuf;
	}
	abstract mtCode: number;
	//abstract queryBuilder(req: ApiGXXReq): Buffer;
	//abstract resultAnalysis(result: Buffer): ApiGXXRes;
	//abstract process(req: ApiGXXReq, socket: net.Socket): ApiGXXRes;
};

export class GTMModule extends Modules {
	mtCode: number = 0x42;
	cmdCodeInfo: number = 0x11;
	cmdCodeRead: number = 0x41;
	cmdCodeWrite: number = 0x43;
	queryBuilder = (req: ApiGXXReq): Promise<Buffer> => {
		return new Promise<Buffer>((resolve, reject) => {
			let query: Buffer;
			let funCode: number = cmdCode[req.reqType];
			let version: string = req.version;
			if (version != "1.0") reject(100);
			if (!funCode) reject(300);
			switch (funCode) {
				case 0x11:
					query = Buffer.from([this.mtCode, funCode]);
					resolve(this.addCRC(query));
					break;
				case 0x41:
					query = Buffer.from([this.mtCode, funCode, 0x00, 0x00, 0x00, 0x08]);
					resolve(this.addCRC(query));
					break;
				//case 0x42:
				case 0x43:
					//GTM,WRITEMUL,[0x00, 0x00],[0x00, 0x08], 0x08, [type, val, type, val, type, val, type, val]);
					query = Buffer.from([this.mtCode, 0x43, 0x00, 0x00, 0x00, 0x08, 0x08,], 15);
					if ((req.reqValue as ReqValueGTMWrite[]).length != 4) reject(300);
					(req.reqValue as ReqValueGTMWrite[]).forEach((channle, index) => {
						if (dtCode[channle.dimType])
							query[index * 2 + 7] = dtCode[channle.dimType];
						else {
							reject(300);
						};
						query[index * 2 + 7 + 1] = dtCode[channle.dimValue];
					});
					resolve(this.addCRC(query));
					break;
				default:
					reject(300);
					break;
			};
		});
	};
	querySend = (query: Buffer, socket: Socket) => {
		return new Promise<Buffer>((resolve, reject) => {
			socket.once("data", (data) => {
				resolve(data);
				clearTimeout(queryTimer);
			});
			socket.once("error", () => {
				reject(301);
			});
			socket.write(query);
			let queryTimer = setTimeout(() => {
				reject(301);
			}, 5000);
		});
	};
	resultAnylasis = (result: Buffer) => {
		let res = <ApiGXXRes>{
			version: "1.0",
			resStatus: 0,
		};
		return new Promise<ApiGXXRes>((resolve, reject) => {
			if (result[0] != this.mtCode)
				reject(301);
			switch (result[1]) {
				case 0x11:
					res.resStatus = 0;
					break;
				case 0x41:
					if (result[2] != 0x08) reject(301);
					res.resStatus = 0;
					let resValueGTMRead: ResValueGTMRead = {
						dimType: "DT_PWM",
						dimValue: 0,
					};
					for (let i = 0; i < 4; i++) {
						resValueGTMRead.dimType = dtAlias[result[i * 2 + 3]];
						resValueGTMRead.dimValue = result[i * 2 + 3 + 1];
						(res.resValue as ResValueGTMRead[]).push(resValueGTMRead);
					}
					break;
				//case 0x42:
				case 0x43:
					res.resStatus = 0;
				default:
					reject(301);
					break;
			};
			resolve(res);
		})
	};
	public process(req: ApiGXXReq, socket: Socket/*, resFun: (res: ApiGXXRes) => void*/) {
		//let response: ApiGXXRes;
		return this.queryBuilder(req)
			.then((query) => {
				return this.querySend(query, socket);
			})
			.then(this.resultAnylasis)
			.then((res) => {
				return res;
				//resFun(res);
			})
			.catch((errCode) => {
				return <ApiGXXRes>{
					version: "1.0",
					resStatus: errCode,
				}
			});
	};
};
