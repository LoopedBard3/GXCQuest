define(['jquery'], function($) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;

            self.wallet = $('#wallet');
            self.GOLD = self.wallet.find("li.gold");
            self.GOLDAmount = self.GOLD.find(".amount");
            self.RUBY = self.wallet.find("li.token");
            self.RUBYAmount = self.RUBY.find(".amount");

            self.player = game.player;
            self.interface = interface;

            self.container = null;
            self.data = {
                GOLDAmount: 0,
                TOKENAmount: 0
            };

            self.RUBY.click(function(e) {
                self.game.socket.send(Packets.Click, ['RUBY', true]);
            })
        },

        update: function(data) {
            var self = this;
            //Update the global data to current revision
            if (data.type === 'GOLD') {
                self.data.goldAmount = data.amount;
                self.GOLDAmount.text(data.amount);
            } else {
                self.data.RUBYAmount = data.amount;
                self.RUBYAmount.text(data.amount);
            }
        },
    });


});
