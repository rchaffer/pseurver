const http = require("http");

class Pseurver {
    constructor(port){
        this.verbose = false;

        if(!port)
            throw Error("No port specified");

        this.port = port;
        this.status = "STOPPED";

        this.server = null;

        this.routeResponses = {};

        return this;
    }

    start(){
        let _this = this;

        this.server = http.createServer(function(request, response){
            let url = request.url;
            let method = request.method.toUpperCase();

            if(
                _this.routeResponses.hasOwnProperty(url)
                && _this.routeResponses[url].hasOwnProperty(method)
            ) {
                let responseTemplate = _this.routeResponses[url][method];

                response.writeHead(
                    responseTemplate.status,
                    responseTemplate.headers
                );

                response.write(
                    typeof responseTemplate.body == "string"
                        ? responseTemplate.body
                        : JSON.stringify(responseTemplate.body)
                );

                response.end("");
            }
        });

        this.server.listen(this.port);

        this.status = "STARTED";

        this.log("Server Started");

        return this;
    }

    stop(){
        this.server.close();

        this.status = "STOPPED";

        this.log("Server Stopped");

        return this;
    }

    setVerbose(state){
        this.verbose = state;

        return this;
    }

    log(message){
        if(this.verbose)
            console.info("Pseurver (:"+this.port+"): "+message);
    }

    register(requestMethod, requestUrl, responseStatus, responseBody, responseHeaders){
        if(!this.routeResponses.hasOwnProperty(requestUrl))
            this.routeResponses[requestUrl] = {};

        this.routeResponses[requestUrl][requestMethod] = {
            status: responseStatus,
            body: responseBody,
            headers: responseHeaders
        };

        this.log("Route `"+requestMethod+" "+requestUrl+"` Registered");

        return this;
    }
};

module.exports = Pseurver;
