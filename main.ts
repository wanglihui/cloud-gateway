import express  = require('express');
import registryClient, {RegistryClient} from 'cloud-registry-client';
import {scannerDecoration, registerControllerToRouter} from 'ts-express-restful';
import * as path from 'path';
import bodyParser from 'body-parser';
const app = express();

const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded());
const ProxyRequest = require("express-request-proxy");

scannerDecoration(path.resolve(__dirname, 'server'), [/\.js$/, /\.js\.map$/, /\.\d.ts$/]);
registerControllerToRouter(router, {isShowUrls: true});

app.use('/api/v1/', router);
app.use(/^\/apps\/([^/]+)(.*)/, async function(req, res, next) {
    const serviceName = req.params[0];
    const url = req.params[1];
    try {
        let services = await registryClient.getServices();
        let avaServices = services.filter( (service) => {
            return service && service.name == serviceName;
        });
        if (!avaServices || !avaServices.length) {
            res.status(404);
            res.json({
                code: 404,
                msg: `SERVER "${serviceName}"  NOT EXISTS OR STATUS NOT ENABLED!`
            })
        }
        const service = avaServices[0];
        const proxy = ProxyRequest({
            url: `http://127.0.0.1:${service.port}${url}`,
        });
        proxy(req, res, next);
    } catch(err) {
        console.error(err);
        res.json({
            code: 500,
            msg: `转发请求给${serviceName}服务时错误！`
        })
    }
});

import * as http from 'http';
import * as net from 'net';
async function main() {
    await startServer({
        port: 8090,
        registry: "http://localhost:8080/api/v1/app"
    });
}

interface IServerConfig {
    port?: number|string;
    registry?: string | boolean;
}

async function startServer(options?: IServerConfig) {
    let defaultOptions = {
        port: 0,
        registry: false,
    }
    options = Object.assign(defaultOptions, options) as IServerConfig;
    const server = http.createServer(app);
    server.on('listening', async () => {
        let addr = (server.address() as net.AddressInfo);
        console.log(`SERVER STARTED LISTENING ON ${addr.address}:${addr.port}...`);
        if (options!.registry) {
            registryClient.init({
                url: options!.registry as string,
            });

            try {
                await registryClient.registry({
                    name: require(path.resolve(process.cwd(), 'package.json')).name,
                    ip: addr.address as string,
                    port: addr.port as number,
                })
            } catch(err) {
                console.error(`注册程序失败，系统将自动退出：`, err);
                process.exit(-1);
            }
        }
    });
    server.on('error', (err) => {
        console.error(`server started error:`, err);
        throw err;
    });
    server.listen(options.port);
    return server;
}

main()
.catch( (err) => {
    console.error('系统启动失败：', err);
    process.exit(-1);
})

const death = require('death');
death(async () => {
    try {
        await registryClient.unRegistry();
    } finally {
        process.exit(-1);
    }
})
