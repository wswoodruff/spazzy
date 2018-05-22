'use strict';

module.exports = (clfStr) => {

    const matches = clfStr.match(new RegExp(/(\S+)\s+(\S+)\s+(\S+)\s+(\[.*?\])\s+(".*?")\s+(\S+)\s+(\S+)/));

    if (!matches) {
        return null;
    }

    const [raw, ipAddress, clientId, userId, date, methodEndpointProtocol, responseCode, bytes] = matches;
    const [method, endpoint, protocol] = methodEndpointProtocol.split(' ');
    return { raw, ipAddress, clientId, userId, date, method, endpoint, protocol, responseCode, bytes };
};
