/* global log */

var cls = cls = require('../lib/class'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    _ = require('underscore');

module.exports = Wallet = cls.Class.extend({

    init: function(player) {
        var self = this;

        self.player = player;
    },

    load: function(accessToken, gqtToken) {
        var self = this;

        self.accessToken = accessToken;
        self.gqtToken = gqtToken;

        self.player.send(new Messages.Wallet(Packets.WalletOpcode.Set, [self.gqtToken]));
    },
});
