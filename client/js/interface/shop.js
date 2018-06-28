define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;

            self.body = $('#shop');
            self.shop = $('#shopContainer');
            self.inventory = $('#shopInventorySlots');

            self.player = game.player;
            self.interface = interface;

            self.container = null;
            self.data = null;

            self.openShop = -1;

            self.items = [];
            self.counts = [];

        },

        buy: function(shopItem) {
            var self = this;
            var count = 1;
            self.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Buy, shopItem.shopId, shopItem.item.id, count]);
        },

        sell: function() {
            var self = this;
            var count = 1;
            self.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Sell, shopItem.shopId, shopItem.item.id, count]);
        },

        /**
         * The shop file is already built to support full de-initialization of objects when
         * we receive an update about the stocks. So we just use that whenever we want to resize.
         * This is just a temporary fix, in reality, we do not want anyone to actually see the shop
         * do a full refresh when they buy an item or someone else buys an item.
         */

        resize: function() {
            var self = this;

            self.getInventoryList().empty();
            self.getShopList().empty();

            self.update(self.data);
        },

        update: function(data) {
            var self = this;

            self.reset();

            self.container = new Container(data.items.length);

            //Update the global data to current revision
            self.data = data;

            self.load();
        },

        load: function() {
            var self = this;

            var shopId = self.data.id,
                items = self.data.items;

            for (var i = 0; i < self.container.size; i++) {
                var item = items[i],
                    itemId = items[i].id,
                    itemString = items[i].string,
                    itemName = items[i].string,
                    itemCount = items[i].count,
                    itemPrice = items[i].price,
                    $itemImage, $itemCount, $itemPrice, $itemName, $itemBuy;

                if (!itemString || !itemName || !itemCount || !itemPrice)
                    continue;

                $itemImage = $('<div class="shopItemImageWrapper col-1 my-auto"></div>');
                $image = $('<div class="shopItemImage"></div>');
                // $itemCount = $('<div class="shopItemCount col-2 my-auto"></div>');
                $itemPrice = $('<div class="shopItemPrice col-2 my-auto"></div>');
                $itemName = $('<div class="shopItemName col-6 my-auto"></div>');
                $itemBuy  = $('<div class="shopItemBuy col-2 my-auto"></div>');
                $buyButton = $('<button class="btn btn-sm btn-success">Buy</button>').attr('index', i);
                $itemBuy.append($buyButton);

                $image.css('background-image', self.container.getImageFormat(self.getScale(), itemString));
                $itemImage.html($image);
                // $itemCount.html(itemCount);
                $itemPrice.html(itemPrice);
                $itemName.html(itemName);

                self.container.setSlot(i, {
                    id: itemId,
                    string: itemString,
                    count: itemCount,
                    price: itemPrice
                });

                // Bind the itemBuy to the local buy function.
                $buyButton.click(function() {
                    var index = $(this).attr('index');
                    // 자산 비교
                    // 수량 확인
                    self.buy({ shopId, item: items[index] });
                });

                var $listItem = $('<li class="shopItem row justify-content-center"></li>');

                // $listItem.append($itemImage, $itemName, $itemCount, $itemPrice, $itemBuy);
                $listItem.append($itemImage, $itemName, $itemPrice, $itemBuy);

                self.getShopList().append($listItem);
            }

            var inventoryItems = self.interface.bank.getInventoryList(),
                inventorySize = self.interface.inventory.getSize();

            for (var j = 0; j < inventorySize; j++) {
                var $item = $(inventoryItems[j]).clone(),
                    $slot = $item.find('#bankInventorySlot' + j);

                self.getInventoryList().append($slot);
            }
        },

        reset: function() {
            var self = this;

            self.items = [];
            self.counts = [];

            self.container = null;

            self.getShopList().empty();
            self.getInventoryList().empty();
        },

        open: function(id) {
            var self = this;

            if (!id)
                return;

            self.openShop = id;

            self.body.fadeIn('slow');
        },

        hide: function() {
            var self = this;

            self.openShop = -1;

            self.body.fadeOut('fast');
        },

        getScale: function() {
            return this.game.renderer.getDrawingScale();
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        isShopOpen: function(shopId) {
            return this.isVisible() && this.openShop === shopId;
        },

        getShopList: function() {
            return this.shop.find('ul');
        },

        getInventoryList: function() {
            return this.inventory.find('ul');
        }

    });


});
