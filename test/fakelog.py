#!/usr/bin/env python
import random
import time

paths = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l'
]
status = [
	200,
	300, 301, 302,
	400, 401, 403, 404,
	500, 501, 502
]
verbs = [
	'HEAD',
	'GET',
	'GET',
	'GET',
	'GET',
	'GET',
	'GET',
	'POST',
	'POST',
	'POST',
	'POST',
	'PUT',
	'DELETE'
]


def logline():
	return '%s - - [%s] "%s /%s HTTP/1.1" %s %s\n' % (
		'.'.join([str(random.randint(0, 1)) for i in range(4)]),
		time.strftime('%d/%h/%Y:%H:%M:%S %z'),
		random.choice(verbs),
		random.choice(paths),
		random.choice(status),
		random.randint(0, 10000))


def new_entry(file):
	file.write(logline())
	file.flush()

logfile = open('./access.log', 'a')
new_entry(logfile)

logfile.close()
