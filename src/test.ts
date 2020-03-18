// // import * as net from "net";

// // function promiseX(n1: boolean, n2: boolean, n3: boolean) {
// // 	return new Promise((resolve, reject) => {
// // 		if (n1)
// // 			resolve(
// // 				new Promise((resolve, reject) => {
// // 					if (n2)
// // 						resolve(
// // 							new Promise((resolve, reject) => {
// // 								if (n3)
// // 									resolve("n1 n2 n3 are all correct.")
// // 								else reject("n3 is false.");
// // 							})
// // 						);
// // 					else reject("n2 is false.");
// // 				})
// // 			);
// // 		else reject("n1 is false.");
// // 	})
// // }

// // let log = "";
// // let n1 = true;
// // let n2 = true;
// // let n3 = true;
// // promiseX(n1, n2, n3)
// // 	.then((log) => { console.log(log) })
// // 	.catch((err) => { console.log(err) });
// import * as net from "net";

// let promise1 = (n: number): Promise<number> => {
// 	return new Promise<number>((resolve, reject) => {
// 		if (n > 10)
// 			resolve(n + 1);
// 		else reject(<string>"n<=10");
// 	})
// }
// let promise2 = (n: number, m: number) => {
// 	return new Promise<any>((resolve, reject) => {
// 		if (n > 20 && n > 0)
// 			resolve(promise3);
// 		else reject("n<=20");
// 	})
// };
// let promise3 = (n: number) => {
// 	return new Promise<any>((resolve, reject) => {
// 		if (n > 30)
// 			resolve("n>100.")
// 		else reject("n>10 and n<=100.");
// 	})
// }

// let x = 25
// promise1(x).
// 	then((val) => {
// 		return promise2(val, 3);
// 	}).
// 	then(promise3).
// 	catch(log => console.log(log));

'use strict'

import { Module } from "module";

//-----------------------

export abstract class Modules {
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
			resBuf.writeInt16LE(crcRes, rawBuf.length);
		else
			resBuf.writeInt16BE(crcRes, rawBuf.length);
		return resBuf;
	}
	abstract mtCode: number;
};

export class GTMModule {
	public queryBuilder(req: number) {
		return new Promise<number>((resolve, reject) => {
			if (req > 1)
				resolve(req);
			else reject("301");
		});
	};
	public querySend(req: number, socket: number[]) {
		return new Promise<number>((resolve, reject) => {
			if (req > 2 && socket[0] === 0)
				resolve(req);
			else reject("302");
		});
	};
	public resultAnylasis(req: number) {
		return new Promise<number>((resolve, reject) => {
			if (req > 3)
				resolve(req);
			else
				reject("303");
		});
	};
	public process(req: number, socket: number[]/*, resFun: (res: ApiGXXRes) => void*/) {
		return this.queryBuilder(req)
			.then((query) => {
				return this.querySend(query, socket);
			})
			//.catch(console.log)
			.then(this.resultAnylasis)
			.then((res) => {
				console.log("resolve.res = " + res);
				//resFun(res);
			})
			.catch((err) => {
				console.log("reject of " + err);
			});
	};
};
const gtm = new GTMModule();
gtm.process(1, [0]);

