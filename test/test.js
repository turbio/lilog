const loggen = require('./loggen');
const fs = require('fs');
const io = require('socket.io-client');
const chai = require('chai');

chai.should();

const port = 3000;
const logFilePath = './testlogfile';

const serverUrl = `http://127.0.0.1:${port}`;

const options ={
	transports: ['websocket'],
	'force new connection': true
};

describe('lilog server', () => { });

describe('lilog logger', () => { });

describe('lilog', () => { });
