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
'use strict';
exports.__esModule = true;
//-----------------------
var Modules = /** @class */ (function () {
    function Modules() {
        this.isFaild = 0;
        this.addCRC = function (rawBuf, isModbus) {
            if (isModbus === void 0) { isModbus = true; }
            var resBuf = Buffer.alloc(rawBuf.length + 2);
            var crcRes = rawBuf.reduce(function (pre, cur, i) {
                resBuf[i] = cur;
                pre = (pre ^ cur);
                for (var i_1 = 0; i_1 < 8; i_1++) {
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
        };
    }
    return Modules;
}());
exports.Modules = Modules;
;
var GTMModule = /** @class */ (function () {
    function GTMModule() {
    }
    GTMModule.prototype.queryBuilder = function (req) {
        return new Promise(function (resolve, reject) {
            if (req > 1)
                resolve(req);
            else
                reject("301");
        });
    };
    ;
    GTMModule.prototype.querySend = function (req, socket) {
        return new Promise(function (resolve, reject) {
            if (req > 2 && socket[0] === 0)
                resolve(req);
            else
                reject("302");
        });
    };
    ;
    GTMModule.prototype.resultAnylasis = function (req) {
        return new Promise(function (resolve, reject) {
            if (req > 3)
                resolve(req);
            else
                reject("303");
        });
    };
    GTMModule.prototype.process = function (req, socket /*, resFun: (res: ApiGXXRes) => void*/) {
        var _this = this;
        return this.queryBuilder(req)
            .then(function (query) {
            return _this.querySend(query, socket);
        })
            .then(this.resultAnylasis)
            .then(function (res) {
            console.log("resolve.res = " + res);
            //resFun(res);
        })["catch"](function (err) {
            console.log("reject of " + err);
        });
    };
    ;
    return GTMModule;
}());
exports.GTMModule = GTMModule;
;
var gtm = new GTMModule();
gtm.process(1, [0]);
