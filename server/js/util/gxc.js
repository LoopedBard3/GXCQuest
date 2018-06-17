var config = require('../../config.json'),
    axios = require('axios');

module.exports = GXC = {
    getBalance: function(account, callback, error_callback) {
        return axios.get(`${config.gxc.server.url}${config.gxc.server.balance.url}${account}`)
            .then(function (response) {
                if(callback) callback(response);
            })
            .catch(function(e) {
                if(error_callback) {
                    error_callback(e);
                } else {
                    console.log(e);
                }
            });
    },

    generateToken: function(account, quantity, callback, error_callback) {
        return axios.post(`${config.gxc.server.url}${config.gxc.server.transfer.url}`,
            { symbol: config.gxc.tokenSymbol, to: account, quantity: quantity },
            { headers: {Authorization: `Bearer ${config.faucet.account.accessToken}` } })
            .then(function (response) {
                if(callback) callback(response);
            })
            .catch(function(e) {
                if(error_callback) {
                    error_callback(e);
                } else {
                    console.log(e);
                }
            });
    },

    consumeToken: function(accessToken, quantity, callback, error_callback) {
        return axios.post(`${config.gxc.server.url}${config.gxc.server.transfer.url}`,
            { symbol: config.gxc.tokenSymbol, to: config.faucet.account.name, quantity: quantity },
            { headers: {Authorization: `Bearer ${accessToken}` } })
            .then(function (response) {
                if(callback) callback(response);
            })
            .catch(function(e) {
                if(error_callback) {
                    error_callback(e);
                } else {
                    console.log(e);
                }
            });
    }
};
