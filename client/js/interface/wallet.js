define(['jquery'], function($) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;

            self.wallet = $('#wallet');
            self.token = $('#token');
            self.tokenAmount = $('#tokenAmount');

            self.player = game.player;
            self.interface = interface;

            self.container = null;
            self.data = {
                tokenAmount: 0
            };

            self.token.click(function(e) {
                self.game.socket.send(Packets.Click, ['token', true]);
            })
        },

        update: function(data) {
            var self = this;

            //Update the global data to current revision
            self.data.tokenAmount = data;

            self.tokenAmount.text(self.data.tokenAmount);
        },
    });


});
