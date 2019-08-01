import { Restful, Router, RequestParam, NextFunction, HttpRequest, HttpResponse } from "ts-express-restful";
import registryClient from 'cloud-registry-client';
const RequestProxy = require('express-request-proxy');

@Restful("/gateway")
export class Proxy {

    @Router('/:serviceName')
    async proxy(@RequestParam serviceName: string, @NextFunction next: any, @HttpRequest req: any,  @HttpResponse res: any){
        console.log("call here...")
        let services = await registryClient.getServices();
        console.log(services);
        let avaServices = services.filter( (service) => {
            return service && service.name == serviceName;
        });
        if (!avaServices || !avaServices.length) {
            return next(404);
        }
        const proxy = RequestProxy();
        proxy(req, res);
    }
}