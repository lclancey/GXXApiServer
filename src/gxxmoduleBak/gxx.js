'use strict'

//---------------------requires---------------------


const crc = require("crc");
const SerialPort = require('serialport');
const InterByteTimeout = require('@serialport/parser-inter-byte-timeout');
const port = new SerialPort("COM4", {
	autoOpen: false,
	baudRate: 9600,
	dataBits: 8,
	stopBits: 1,
	parity: "none"
});
const parser = port.pipe(new InterByteTimeout({
	"interval": 30,
	"maxBufferSize": 48
}));
//---------------------const vals---------------------
const GSS = 0x40;
const GOM = 0x41;
const N_OM = 10;
const GTM = 0x42;
const GDI = 0x43;

const REPORTINFO = 0x11;
const READ = 0x41;
const WRITEONE = 0x42;
const WRITEMUL = 0x43;

const ProbeType_NONE = 0x0;
const ProbeType_SHT3x = 0x1;
const ProbeType_CCS811 = 0x2;
const ProbeType_OPT3002 = 0x3;
const ProbeType_UNKNOW = 0xF;
//---------------------const vals---------------------

//---------------------support funcs and vars--------------------
let queryTimer;
let writeIndex = 0;
function queryBuilder(addr, funcCode, param1, param2, param3, param4) {
	let queryArr = [addr].concat(funcCode);
	if (param1)
		queryArr = queryArr.concat(param1);
	if (param2)
		queryArr = queryArr.concat(param2);
	if (param3)
		queryArr = queryArr.concat(param3);
	if (param4)
		queryArr = queryArr.concat(param4);
	let crcRet = crc.crc16modbus(queryArr);
	return Buffer.from(queryArr.concat(crcRet & 0xFF, crcRet >> 8));
}
let gomWriteMulComtainerSet = [0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01];
let gomWriteMulComtainerReset = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
//---------------------GOM test funcs--------------------

function GDIInfo() {
	queryTimer = setInterval(() => {
		let GDIInfoQuery = queryBuilder(GDI, REPORTINFO);
		port.write(GDIInfoQuery);
		console.log(`-->>:${GDIInfoQuery.toString("hex")}`);
		writeIndex++;
	}, 1000);
}
function GOMWriteOne() {
	queryTimer = setInterval(() => {
		let GOMExeQuery = queryBuilder(GOM, WRITEONE, [0x00, (writeIndex >> 1) % 10], [writeIndex % 2]);
		port.write(GOMExeQuery);
		console.log(`-->>:${GOMExeQuery.toString("hex")}`);
		writeIndex++;
	}, 3000);
};
function GOMWriteMul() {
	queryTimer = setInterval(() => {
		//param1=RegisterAddress, 2 bytes
		//param2=RegisterNumber, 2 bytes
		//param3=ByteCount, 1 byte
		//param4=RegisterValue, n bytes
		let num = (writeIndex >> 1) % 10 + 1;
		let vals;
		if (writeIndex & 0x01)
			vals = gomWriteMulComtainerSet.slice(0, num);
		else
			vals = gomWriteMulComtainerReset.slice(0, num);
		let GOMExeQuery = queryBuilder(GOM, WRITEMUL, [0x00, 0x00], [0x00, num], num, vals);
		port.write(GOMExeQuery);
		console.log(`-->>:${GOMExeQuery.toString("hex")}`);
		writeIndex++;
	}, 3000);
};
function GSSRead() {
	queryTimer = setInterval(() => {
		let GSSReadQuery = queryBuilder(GSS, READ, [0x00, 0x00], [0x00, 0x0F]);
		port.write(GSSReadQuery);
		console.log(`-->>:${GSSReadQuery.toString("hex")}`);
		writeIndex++;
	}, 3000);
};
function GTMInfo() {
	queryTimer = setInterval(() => {
		let GTMInfoQuery = queryBuilder(GTM, REPORTINFO);
		port.write(GTMInfoQuery);
		console.log(`-->>:${GTMInfoQuery.toString("hex")}`);
		writeIndex++;
	}, 1000);
};;
function GTMRead() {
	queryTimer = setInterval(() => {
		let GTMReadQuery = queryBuilder(GTM, READ, [0x00, 0x00], [0x00, 0x10]);
		port.write(GTMReadQuery);
		console.log(`-->>:${GTMReadQuery.toString("hex")}`);
	}, 3000);
}
function GTMLoop() {
	queryTimer = setInterval(() => {
		let val = (writeIndex % 4) * 25;
		let type = (writeIndex >> 2) & 0x01;
		let GTMLoopQuery = queryBuilder(GTM, WRITEMUL, [0x00, 0x00], [0x00, 0x08], 0x08, [type, val, type, val, type, val, type, val]);
		port.write(GTMLoopQuery);
		console.log(`-->>:${GTMLoopQuery.toString("hex")}`);
		writeIndex++;
	}, 3000)
}
//------------------result anylasis funcs-----------------------
function GSSAnalysis(data) {
	let index = 0;
	let str = `<<--:`
	if (data.length != 20) {
		return false;
	}
	if (data[index++] !== GSS) {
		return false;
	};
	if (data[index++] !== READ) {
		return false;
	};
	if (data[index++] % 5 !== 0) {
		return false;
	};
	for (let i = 0; i < data[2] / 5; i++) {
		switch (data[3 + i * 5]) {
			case ProbeType_CCS811:
				str += `\ntype${i} =CCS811\t`;
				break;
			case ProbeType_SHT3x:
				str += `\ntype${i} =SHT3x\t`;
				break;
			case ProbeType_OPT3002:
				str += `\ntype${i} =OPT3002\t`;
				break;
			default:
				str += `\ntype${i} =UNKNOW\t`
				break;

		};
		str += `val${i}_1 = ${data.readInt16LE(3 + i * 5 + 1)} \t`;
		str += `val${i}_2 = ${data.readInt16LE(3 + i * 5 + 3)} \t`;
	}
	console.log(str);
	return true;
}
//------------------port config-----------------------
port.on("error", (error) => {
	console.log(`COM   :err=${error}`);
});

port.on("open", GTMInfo);

port.on("close", () => {
	clearInterval(queryTimer);
});
parser.on("data", (data) => {
	console.log(`<<--:${data.toString("ASCII")}`);
	GSSAnalysis(data);
});
parser.on("end", () => {
	console.log(`COM   :end.`);
});

// function serialAnylasis(data) {
// 	if (data[1] == 0x11)//report slaveID
// 	{
// 		if (isFirstLine) {
// 			console.log(`DATA  :Reporting SlaveID.`)
// 			isFirstLine = false;
// 		}
// 		console.log(`      :${data}`);
// 	}
// 	else {
// 		switch (data[0]) {
// 			case 0x43://GDI
// 				if (isFirstLine) {
// 					console.log(`Data  :GDI Status.`)
// 					console.log(`      :`);
// 					isFirstLine = false;
// 				}
// 				console.log('      :' + data.toString("HEX", 3, data.length - 2));
// 				break;
// 		}
// 	}
// }




port.open();
