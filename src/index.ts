import { ClientPool, IClient } from "./tcpServer/tcpServer";
import { GTMModule, ApiGXXRes, ApiGXXReq } from "./gxxModule/gxxModule";
import Hapi from "hapi";

const clientPool = new ClientPool();
const gtmModule = new GTMModule();
const apiServer = new Hapi.Server({ port: 62000, host: "192.168.1.64" });

clientPool.
	on("connect", (c: number) => {
		console.log(`A clietn has connect to this server, clients' number are ${c} now.`);
	}).
	on("disconnect", (c: number) => {
		console.log(`A clietn has disconnect to this server, clients' number are ${c} now.`);
	});

apiServer.route({
	path: "/",
	method: "POST",
	handler(request) {
		//for now, user cannot select which tcpLink to use.
		if ((<IClient[]>clientPool.getClient())[0])
			return gtmModule.process(<ApiGXXReq>request.payload, (<IClient[]>clientPool.getClient())[0].socket);
		else return <ApiGXXRes>{
			version: "1.0",
			resStatus: 200,
		}
	}
})
apiServer.start();

//gtmModule.process()
// apiServer
// 	.use(async (context, next) => {
// 		console.log(context.body);
// 		console.log(`http request from ${context.request.url}`);
// 		context.response.body = { xyz: 123 };
// 		await next();
// 	})
// 	.listen(62000, "192.168.1.64")
// 	.on("listening", () => {
// 		console.log(`ApiServer listening on 192.168.1.64:62000.`);
// 	});



