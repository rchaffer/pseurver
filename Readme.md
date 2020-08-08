# Pseurver

> The pseudo-server

Pseurver is designed to provide very basic responses to pre-registered routes. It presents an alternative approach to the server mocking in test helpers like Moxios and Sinon. Rather than setting up spies, you set up an actual HTTP server, and tell it what response you expect to receive for a given route. 

Pseurver **is**:-
*	standalone
*	compact
*	dumb

Pseurver **is not**:-
*	at all clever
*	capable of dynamic content
*	capable of HTTPS (yet)
*	**in any way production-ready**


## Requirements

This module only uses the `http` built-in Node module, and requires no special modules or `npm install`s.


## Usage

1.	Copy the `src/pseurver` directory to your application's `node_modules` directory (there is currently no `npm` repository).

2.	At the top of your test file, `require` the `pseurver` module - note that the constant you specify is actaully the Pseurver class:-

	```js
	const Pseurver = require("pseurver");
	```

3.	Use the `Pseurver` class constructor to assemble a server that will listen on the provided port:-

	```js
	describe("Pseurver construction", function(){
		it("should set the port on the instance", function(){
			let server = new Pseurver(8001);
		});
	});
	```

4.	Register route -> response correlations through the `register` method. The method takes a request method, request route (without protocol or domain), response status code, response body and response headers:-

	```js
	describe("Pseurver registration", function(){
		it("should allow route-response registration", function(){
			let server = new Pseurver(8001);
			server.register("GET", "/", 200, "Response", {"Content-Type": "text/plain"});
		});
	});
	```

5.	Start and stop the server using the `start` and `stop` methods. Registration of routes can be done before or after starting the server. For contextual tests (like a sub-`describe` in Jasmine) that share a server instance, the `start` should be done in the `beforeEach` and `stop` in the `afterEach` of the block:-

	```js
	describe("Blog loader", function(){
		let server = null;
		//
		describe("when post exists", function(){
			beforeEach(function(){
				server = new Pseurver(8001);
				server.register(
					"GET", 
					"/posts/1", 
					200, 
					{title: "Post One", body: "Lorem ipsum dolor sit amet..."}, 
					{"Content-Type": "application/json"}
				);
				server.start();
			});
			//
			afterEach(function(){
				server.stop();
			});
			//
			it("should get details successfully", async function(done){
	            let response = await fetch("http://localhost:8001/posts/1")
	                .then(function(response) {
	                    expect(response.status).toEqual(200);
	                    expect(response.headers.get("Content-Type")).toEqual("application/json");
	                    return response.json();
	                })
	                .then(function(json){
	                    expect(json.title).toEqual("Post One");
	                    expect(json.body).toEqual("Lorem ipsum dolor sit amet...");
	                    done();
	                });
			});
		});
		//
		describe("when post does not exist", function(){
			beforeEach(function(){
				server = new Pseurver(8001);
				server.register(
					"GET", 
					"/posts/1", 
					404, 
					"Not Found"
				);
				server.start();
			});
			//
			afterEach(function(){
				server.stop();
			});
			//
			it("should get details successfully", async function(done){
	            let response = await fetch("http://localhost:8001/posts/1")
	                .then(function(response) {
	                    expect(response.status).toEqual(404);
	                    return response.text();
	                })
	                .then(function(text){
	                    expect(text).toEqual("Not Found");
	                    done();
	                });
			});
		});
	});
	```

Note that the methods can be chained, like so:-

```js
const Pseurver = require("pseurver");

let server = new Pseurver(8001)
	.register(
		"GET",
		"/posts",
		200,
		[
			{id: 1, title: "Post One", body: "Lorem ipsum dolor sit amet"},
			{id: 2, title: "Post Two", body: "Lorem ipsum dolor sit amet"},
			{id: 3, title: "Post Three", body: "Lorem ipsum dolor sit amet"}
		]
	)
	.register(
		"GET",
		"/posts/1",
		200,
		{id: 1, title: "Post One", body: "Lorem ipsum dolor sit amet"}
	)
	.register(
		"GET",
		"/posts/4",
		404,
		"Not found"
	)
	.start();
```

For a real-world example, have a look at the `covid-tracker` javascript tests.