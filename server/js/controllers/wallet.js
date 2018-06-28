/* global log */

var cls = cls = require('../lib/class'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    _ = require('underscore');

module.exports = Wallet = cls.Class.extend({

    init: function(player) {
        var self = this;

        self.player = player;
        self.accessToken = '';
        self.gqtToken = 0;
        self.gold = 0;
    },

    load: function(accessToken, gqtToken, gold) {
        var self = this;

        self.accessToken = accessToken;
        self.gqtToken = gqtToken;
        self.gqtToken = gold;
        
        var tokenData = { type: 'token', amount: gqtToken };
        var goldData = { type: 'gold', amount: gold };

        self.player.send(new Messages.Wallet(Packets.WalletOpcode.Set, tokenData));
        self.player.send(new Messages.Wallet(Packets.WalletOpcode.Set, goldData));
    },
});
