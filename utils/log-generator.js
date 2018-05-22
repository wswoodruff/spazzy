'use strict';

// http test access-log file from http://ita.ee.lbl.gov/html/contrib/NASA-HTTP.html

const Fs = require('fs');
const Items = require('items');
const ClfParser = require('../utils/parse-common-log-format');
const Strftime = require('strftime');

// Init draftlog
require('draftlog').into(console);

const LOGS_LENGTH = 90000;
const CLF_DATE_FORMAT = '%d/%b/%Y:%H:%M:%S %z';

const internals = {};

const LogGenerator = exports;

LogGenerator.start = (options) => {

    options.script = options.script || [];
    options.file = options.file || `${__dirname}/../test/test-access.log`;

    let testDataLine;
    let logsWrittenLine;

    if (!options.silent) {
        testDataLine = console.draft();
        logsWrittenLine = console.draft('logs written: 0');
    }

    let totalLogsWritten = 0;
    let totalLogsLoaded = 0;

    const parsedLogs = new Array(LOGS_LENGTH);

    const readFile = `${__dirname}/../test/NASA_access_log_Jul95.log`;
    const writeFile = options.file;

    Fs.writeFileSync(writeFile, '');

    const writeStream = Fs.createWriteStream(writeFile);
    const stream = Fs.createReadStream(readFile);

    if (!options.silent) {
        testDataLine('Begin loading test data...');
    }

    let i = 0;
    stream.on('data', (data) => {

        const parsedLine = ClfParser(data.toString('utf8'));
        parsedLogs[++i] = parsedLine;
        totalLogsLoaded++;
    });

    stream.on('error', (err) => {

        console.log('err', err);
    });

    stream.on('end', () => {

        if (!options.silent) {
            testDataLine('All test data read into memory');
        }
    });

    let j = 0;
    Items.serial(options.script, (scriptItem, next) => {

        let amountWritten = 0;
        const logInterval = setInterval(() => {

            if (amountWritten >= scriptItem.amount) {
                clearInterval(logInterval);
                return next();
            }

            const safeIndex = Math.floor(j % totalLogsLoaded);

            const newLogItem = {
                ...parsedLogs[safeIndex],
                date: Strftime(CLF_DATE_FORMAT)
            };

            const reformatted = `${newLogItem.ipAddress} ${newLogItem.clientId} ${newLogItem.userId} [${newLogItem.date}] ${newLogItem.method} ${newLogItem.endpoint} ${newLogItem.protocol} ${newLogItem.responseCode} ${newLogItem.bytes}\n`;

            writeStream.write(`${reformatted}`);
            amountWritten++;
            totalLogsWritten++;
            j++;

            if (!options.silent) {
                logsWrittenLine(`logs written: ${totalLogsWritten}`);
            }

        }, scriptItem.duration / scriptItem.amount);
    },
    () => {

        console.log('Script complete.');
    });
};
