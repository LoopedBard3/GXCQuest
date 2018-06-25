/* global log */

var Container = require('../container'),
    Messages = require('../../../../../../network/messages'),
    Packets = require('../../../../../../network/packets'),
    Constants = require('./constants'),
    _ = require('underscore'),
    Items = require('../../../../../../util/items'),
    GXC = require('../../../../../../util/gxc');

module.exports = Inventory = Container.extend({

    init: function(owner, size) {
        var self = this;

        self._super('Inventory', owner, size);
    },

    load: function(ids, counts, abilities, abilityLevels) {
        var self = this;

        self._super(ids, counts, abilities, abilityLevels);

        self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Batch, [self.size, self.slots]));
    },

    add: function(item, count) {
        var self = this;

        if (!count)
            count = -1;

        if (count === -1)  //default to moving whole stack
            count = parseInt(item.count);

        if (!self.canHold(item.id, count)) {
            self.owner.send(new Messages.Notification(Packets.NotificationOpcode.Text, Constants.InventoryFull));
            return false;
        }

        var slot = self._super(item.id, count, item.ability, item.abilityLevel);
        
        if (!slot)
            return false;

        if(Items.isCryptoCurrency(item.id)) {
            var error_callback = function(e) {
            console.log(e);
            };

            GXC.getBalance(self.owner.username, function(response) {
                if (response.data && response.data.success) {
                    let balance = response.data.balance;
                    console.log(response.data);
                    GXC.generateToken(self.owner.username, count, function(response) {
                        console.log(response.data);
                        if (response.data && response.data.success && response.data.transaction) {
                            const quantity = response.data.transaction.quantity;
                            if (quantity === count) {
                                balance += quantity;
                                var type = 'UPDATE IGNORE';
                                var updateDate = {
                                    username: self.owner.username,
                                    gqtToken: balance
                                }
                                self.owner.mysql.queryData(type, 'player_wallet', updateDate);
                                self.owner.send(new Messages.Wallet(Packets.WalletOpcode.Set, [balance]));
                                
                                self.processAdd(item, slot);
                            }
                        }
                    }, error_callback);
                } else {
                    error_callback(response);
                }
            }, error_callback);
        } else {
            self.processAdd(item, slot);
        }

        return true;
    },

    processAdd: function(item, slot) {
        var self = this;

        self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Add, slot));

        self.owner.save();

        if (item.instance)
            self.owner.world.removeItem(item);
    },

    remove: function(id, count, index) {
        var self = this;

        if (!index)
            index = self.getIndex(id);

        var processRemove = function() {
            if (!self._super(index, id, count))
            return;

            self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Remove, {
                index: parseInt(index),
                count: count
            }));

            self.owner.save();
        }

        if (!self._super(index, id, count))
            return;

        if(Items.isCryptoCurrency(id)) {
            var error_callback = function(e) {
                console.log(e);
            };

            GXC.getBalance(self.owner.username, function(response) {
                if (response.data && response.data.success) {
                    let balance = response.data.balance;
                    GXC.consumeToken(self.owner.wallet.accessToken, count, function(response) {
                        if (response.data && response.data.success && response.data.transaction) {
                            const quantity = response.data.transaction;
                            if (quantity === count) {
                                balance -= quantity;
                                var type = 'UPDATE IGNORE';
                                var updateDate = {
                                    username: self.owner.username,
                                    gqtToken: balance
                                }
                                self.owner.mysql.queryData(type, 'player_wallet', updateDate);
                                self.owner.send(new Messages.Wallet(Packets.WalletOpcode.Set, [balance]));
                                processRemove(index, count);
                            }
                        }
                    }, error_callback);
                } else {
                    error_callback(response);
                }
            }, error_callback);
        } else {
            processRemove(index, count);
        }
    },

    processRemove: function(index, count) {
        var self = this;

        self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));

        self.owner.save();
    }

});
