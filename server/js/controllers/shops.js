var cls = require('../lib/class'),
    ShopData = require('../util/shops'),
    Items = require('../util/items'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    _ = require('underscore');

/**
 * The only data we will mutate is ShopsData.Data
 * This is when a player sells or buys items, which
 * overtime, regenerate.
 */

module.exports = Shops = cls.Class.extend({

    init: function(world) {
        var self = this;

        self.world = world;

        self.shopInterval = null;
        self.interval = 60000;

        self.load();
    },

    load: function() {
        var self = this;

        self.shopInterval = setInterval(function() {

            _.each(ShopData.Data, function(info) {

                for (var i = 0; i < info.count; i++)
                    if (info.count[i] < info.originalCount[i])
                        ShopData.increment(info.id, info.items[i], 1);

            });

        }, self.interval);
    },

    open: function(player, shopId) {
        var self = this;

        player.send(new Messages.Shop(Packets.ShopOpcode.Open, {
            instance: player.instance,
            npcId: shopId,
            shopData: self.getShopData(shopId)
        }));

    },

    buy: function(player, shopId, itemId, count) {
        var self = this,
            cost = ShopData.getCost(shopId, itemId, count),
            currency = self.getCurrency(shopId),
            stock = ShopData.getStock(shopId, itemId);

        //TODO: Make it so that when you have the exact coin count, it removes coins and replaces it with the item purchased.

        if (stock === 0) {
            player.notify('This item is currently out of stock.');
            return;
        }

        if (!player.inventory.hasSpace()) {
            player.notify('You do not have enough space in your inventory.');
            return;
        }
    
        if (count > stock)
            count = stock;

        if (Items.isCurrency(currency)) {
            player.inventory.remove(currency, cost, undefined, function () {
                player.inventory.add({ id: itemId, count }, count);
    
                ShopData.decrement(shopId, itemId, count);
        
                self.refresh(shopId);
            });
        } else {
            if (!player.inventory.contains(currency, cost)) {
                player.notify('You do not have enough money to purchase this.');
                return;
            }
    
            player.inventory.remove(currency, cost);
            player.inventory.add({ id: itemId, count }, count);
    
            ShopData.decrement(shopId, itemId, count);
    
            self.refresh(shopId);
        }
    },

    refresh: function(shopId) {
        var self = this;

        self.world.pushBroadcast(new Messages.Shop(Packets.ShopOpcode.Refresh, self.getShopData(shopId)));
    },

    getCurrency: function(id) {
        return ShopData.Ids[id].currency;
    },

    getShopData: function(id) {
        var self = this;

        if (!ShopData.isShopNPC(id))
            return;

        var itemIds = ShopData.getItems(id),
            itemPrices = ShopData.getPrices(id),
            itemCounts = ShopData.getCount(id),
            items = [];

        for (var i = 0; i < itemIds.length; i++) {
            var item = {
                id: itemIds[i],
                string: Items.idToString(itemIds[i]),
                name: Items.idToName(itemIds[i]),
                count: itemCounts[i],
                price: itemPrices[i]
            };
            items.push(item);
        }

        return { id, items };
    }
});