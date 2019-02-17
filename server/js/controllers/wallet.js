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
        self.GOLD = 0;
        self.RUBY = 0;
    },

    load: function(accessToken, GOLD, RUBY) {
        var self = this;

        self.accessToken = accessToken;
        self.GOLD = GOLD;
        self.RUBY = RUBY;
        
        var tokenData = { type: 'GOLD', amount:  GOLD };
        var goldData = { type: 'RUBY', amount: RUBY };

        self.player.send(new Messages.Wallet(Packets.WalletOpcode.Set, tokenData));
        self.player.send(new Messages.Wallet(Packets.WalletOpcode.Set, goldData));
    },
});
