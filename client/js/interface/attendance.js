define(['jquery'], function($) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;
            self.interface = interface;

            self.attendance = $('#attendance');
            self.stamps = self.attendance.find('.stamps');
            self.attendanceOK = self.attendance.find('.attendance-ok');

            self.attendanceOK.click(function() {
                self.attendance.css('opacity', 0);
                self.attendance.css('display', 'none');
            })
        },

        update: function(data) {
            var self = this;

            var size = 25;

            if (size > 25) {
                self.attendanceOk.click();
            }

            var $stamp = $('<div class="stamp"></div>');
            for (var i=1; i <= data && i < size; i++) {
                self.stamps.append($stamp.clone());
            }

            if(data === size) {
                self.attendance($('<div class="big-stamp"></div>'))
            }
        }
    });
});
