#!/usr/bin/env python
import random
import time

paths = [
	'',
	# 'index.html',
	# 'style.css',
	# 'stuff',
	# 'this',
	# 'is',
	# 'a',
	# 'test',
	# 'wew',
]
status = [
	200,
	300, 301, 302,
	400, 401, 403, 404,
	500, 501, 502
]


def logline():
	return '%s - - [%s] "HEAD /%s HTTP/1.1" %s %s\n' % (
		# '.'.join([str(random.randint(0, 255)) for i in range(4)]),
		'0.0.0.0',
		time.strftime('%d/%h/%Y:%H:%M:%S %z'),
		random.choice(paths),
		random.choice(status),
		0)

def new_entry(file):
	file.write(logline())
	file.flush()

logfile = open('./access.log', 'a')
new_entry(logfile)

logfile.close()
