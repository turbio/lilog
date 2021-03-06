#!/usr/bin/env python
import time
import random
import re

from_logfile = open('./tests2.log', 'r')
to_logfile = open('./access.log', 'a')

find_date = re.compile('\[[^\]]+\]')

for line in from_logfile:
	to_logfile.write(re.sub(find_date, '[%s]' % time.strftime('%d/%h/%Y:%H:%M:%S %z'), line))
	to_logfile.flush()
	time.sleep(random.random() / 10)
