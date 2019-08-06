import { Restful, GetMapping } from "ts-express-restful";

@Restful("/health")
export default class Health {

    @GetMapping("/status")
    index(){
        return {
            status: 'UP',
        }
    }
}