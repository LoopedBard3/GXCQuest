define(['jquery'], function($) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;

            self.wallet = $('#wallet');
            self.gold = self.wallet.find("li.gold");
            self.goldAmount = self.gold.find(".amount");
            self.token = self.wallet.find("li.token");
            self.tokenAmount = self.token.find(".amount");

            self.player = game.player;
            self.interface = interface;

            self.container = null;
            self.data = {
                goldAmount: 0,
                tokenAmount: 0
            };

            self.token.click(function(e) {
                self.game.socket.send(Packets.Click, ['token', true]);
            })
        },

        update: function(data) {
            var self = this;

            //Update the global data to current revision
            if (data.type === 'gold') {
                self.data.goldAmount = data.amount;
                self.goldAmount.text(data.amount);
            } else {
                self.data.tokenAmount = data.amount;
                self.tokenAmount.text(data.amount);
            }
        },
    });


});
