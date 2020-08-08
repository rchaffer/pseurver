const jasmine = require("jasmine");
const fetch = require("node-fetch");
const Pseurver = require("../index.js");

describe("Pseurver", function(){

    describe("constructor", function(){

        it("should error when port not supplied", function(){
            expect(function(){
                let server = new Pseurver();
            }).toThrowError("No port specified");
        });

        it("should initialise the status", function(){
            let server = new Pseurver(8001);

            expect(server.status).toEqual("STOPPED");
        });

        it("should store the port", function(){
            let server = new Pseurver(8001);

            expect(server.port).toEqual(8001);
        });

    });

    describe("start", function(){

        it("should connect the server", function(){
            let server = new Pseurver(8001).register("GET", "/", 200, "Response").start();

            expect(server.status).toEqual("STARTED");

            server.stop();
        });

        it("should occupy the port (root)", async function(done){
            let server = new Pseurver(8001).register("GET", "/", 200, "Response").start();

            let response = await fetch("http://localhost:8001/")
                .then(function(response) {
                    expect(response.status).toEqual(200);
                    return response.text();
                })
                .then(function(text){
                    expect(text).toEqual("Response");
                    done();
                });

            server.stop();
        });

        it("should occupy the port (offset)", async function(done){
            let server = new Pseurver(8001).register("GET", "/endpoint", 200, "Response").start();

            let response = await fetch("http://localhost:8001/endpoint")
                .then(function(response) {
                    expect(response.status).toEqual(200);
                    return response.text();
                })
                .then(function(text){
                    expect(text).toEqual("Response");
                    done();
                });

            server.stop();
        });

    });

    describe("stop", function(){

        it("should disconnect the server", function(){
            let server = new Pseurver(8001).register("GET", "/", 200, "Response").start();
            server.stop();

            expect(server.status).toEqual("STOPPED");
        });

        it("should free up the port", async function(done){
            let server = new Pseurver(8001).register("GET", "/", 200, "Response").start();
            server.stop();

            let response = await fetch("http://localhost:8001/")
                .then(function(response) {
                    fail("Reached fetch.then, but should have reached fetch.catch");
                })
                .catch(function(error){
                    expect(error.code).toEqual("ECONNREFUSED");
                    done();
                });
        });

    });

    describe("association registration", function(){

        it("should add basic route-response associations", function(){
            let server = new Pseurver(8001)
                .register(
                    "GET",
                    "/endpoint",
                    200,
                    {"attribute": "value"},
                    {"Content-Type": "application/json"}
                );

            expect(server.routeResponses).toBeInstanceOf(Object);
            expect(Object.keys(server.routeResponses).length).toEqual(1);

            expect(server.routeResponses.hasOwnProperty("/endpoint")).toBeTrue();
            expect(server.routeResponses["/endpoint"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"].hasOwnProperty("GET")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].status).toEqual(200);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].body).toEqual({"attribute": "value"});
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].headers).toEqual({"Content-Type": "application/json"});
        });

        it("should add conditional route-response associations", function(){
            let server = new Pseurver(8001)
                .register(
                    "GET",
                    "/endpoint?variant=a",
                    200,
                    {"attribute": "value"},
                    {"Content-Type": "application/json"}
                )
                .register(
                    "GET",
                    "/endpoint?variant=b",
                    500,
                    "An error occurred",
                    {"Content-Type": "text/plain"}
                );

            expect(server.routeResponses).toBeInstanceOf(Object);
            expect(Object.keys(server.routeResponses).length).toEqual(2);

            expect(server.routeResponses.hasOwnProperty("/endpoint?variant=a")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=a"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint?variant=a"].hasOwnProperty("GET")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=a"]["GET"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].status).toEqual(200);
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].body).toEqual({"attribute": "value"});
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=a"]["GET"].headers).toEqual({"Content-Type": "application/json"});

            expect(server.routeResponses.hasOwnProperty("/endpoint?variant=b")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=b"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint?variant=b"].hasOwnProperty("GET")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=b"]["GET"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].status).toEqual(500);
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].body).toEqual("An error occurred");
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint?variant=b"]["GET"].headers).toEqual({"Content-Type": "text/plain"});
        });

        it("should add same-url method-differentiated route-response associations", function(){
            let server = new Pseurver(8001)
                .register(
                    "GET",
                    "/endpoint",
                    200,
                    {"attribute": "value"},
                    {"Content-Type": "application/json"}
                )
                .register(
                    "POST",
                    "/endpoint",
                    500,
                    "An error occurred",
                    {"Content-Type": "text/plain"}
                );

            expect(server.routeResponses).toBeInstanceOf(Object);
            expect(Object.keys(server.routeResponses).length).toEqual(1);

            expect(server.routeResponses.hasOwnProperty("/endpoint")).toBeTrue();
            expect(server.routeResponses["/endpoint"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"].hasOwnProperty("GET")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].status).toEqual(200);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].body).toEqual({"attribute": "value"});
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].headers).toEqual({"Content-Type": "application/json"});

            expect(server.routeResponses.hasOwnProperty("/endpoint")).toBeTrue();
            expect(server.routeResponses["/endpoint"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"].hasOwnProperty("POST")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["POST"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"]["POST"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["POST"].status).toEqual(500);
            expect(server.routeResponses["/endpoint"]["POST"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["POST"].body).toEqual("An error occurred");
            expect(server.routeResponses["/endpoint"]["POST"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["POST"].headers).toEqual({"Content-Type": "text/plain"});
        });

        it("should redefine duplicate no-conditional route-response associations", function(){
            let server = new Pseurver(8001)
                .register(
                    "GET",
                    "/endpoint",
                    200,
                    {"attribute": "value"},
                    {"Content-Type": "application/json"}
                )
                .register(
                    "GET",
                    "/endpoint",
                    500,
                    "An error occurred",
                    {"Content-Type": "text/plain"}
                );

            expect(server.routeResponses).toBeInstanceOf(Object);
            expect(Object.keys(server.routeResponses).length).toEqual(1);

            expect(server.routeResponses.hasOwnProperty("/endpoint")).toBeTrue();
            expect(server.routeResponses["/endpoint"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"].hasOwnProperty("GET")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"]).toBeInstanceOf(Object);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("status")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].status).toEqual(500);
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("body")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].body).toEqual("An error occurred");
            expect(server.routeResponses["/endpoint"]["GET"].hasOwnProperty("headers")).toBeTrue();
            expect(server.routeResponses["/endpoint"]["GET"].headers).toEqual({"Content-Type": "text/plain"});
        });

    });

    describe("when fetch request made to registered route/method", function(){

        let server = null;

        beforeEach(function(){
            server = new Pseurver(8001)
                .register(
                    "GET",
                    "/endpoint",
                    200,
                    {"attribute": "value"},
                    {"Content-Type": "application/json"}
                )
                .start();
        });

        afterEach(function(){
            server.stop();
        });

        it("should return a response with the registered status", async function(done){
            let response = await fetch("http://localhost:8001/endpoint")
                .then(function(response){
                    expect(response.status).toEqual(200);
                    done();
                });
        });

        it("should return a response with the registered body", async function(done){
            let response = await fetch("http://localhost:8001/endpoint")
                .then(function(response){
                    return response.json();
                })
                .then(function(jsonData){
                    expect(jsonData).toEqual({"attribute": "value"});
                    done();
                });
        });

        it("should return a response with the registered headers", async function(done){
            let response = await fetch("http://localhost:8001/endpoint")
                .then(function(response){
                    expect(response.headers.has("Content-Type")).toBeTrue();
                    expect(response.headers.get("Content-Type")).toEqual("application/json");
                    done();
                });
        });

    });

});
