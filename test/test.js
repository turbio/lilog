const loggen = require('./loggen');
const fs = require('fs');
const io = require('socket.io-client');
const chai = require('chai');
const request = require('request');

const Server = require('../server');
const Log = require('../log');

chai.should();

const port = 3000;

//const logFilePath = './testlogfile';

//const serverUrl = `http://127.0.0.1:${port}`;

//const options ={
	//transports: ['websocket'],
	//'force new connection': true
//};

describe('lilog server', () => {
	let server = null;

	before(() => {
		server = new Server(port);
		server.start();
	});

	it('should serve index page', (done) => {
		request(`http://localhost:${port}`, (err, res) => {
			res.body.should.match(/<html/);
			res.body.should.match(/<head/);
			res.body.should.match(/<body/);
			done(err);
		});
	});

	it('should serve static css', (done) => {
		request(`http://localhost:${port}/style.css`, (err, res) => {
			res.body.should.match(/\w.+ {.+}/);
			done(err);
		});
	});
});

describe('lilog logger', (done) => {
	let log = null;

	before(() => {
		log = new Log();
		log.loadParsers().then(done);
	});

	it('should list all parsers', () => {
		log.listParsers()
			.map((parser) => parser.name)
			.should.contain('clf');
	});

	it('should select a parser', () => {
		log.setParser('clf');
		log.selectedParser.name.should.eq('clf');
	});
});

describe('lilog', () => { });
