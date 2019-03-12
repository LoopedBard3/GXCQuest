/* global log */

var cls = require('../lib/class'),
    Packets = require('../network/packets'),
    Request = require('request'),
    config = require('../../config.json'),
    Creator = require('../database/creator'),
    _ = require('underscore'),
    Messages = require('../network/messages'),
    sanitizer = require('sanitizer'),
    Commands = require('./commands'),
    Items = require('../util/items'),
    Utils = require('../util/utils'),
    gxc = require('../util/gxc');

module.exports = Incoming = cls.Class.extend({

    init: function(player) {
        var self = this;

        self.player = player;
        self.connection = self.player.connection;
        self.world = self.player.world;
        self.mysql = self.player.mysql;
        self.commands = new Commands(self.player);

        self.connection.listen(function(data) {

            var packet = data.shift(),
                message = data[0];

            if (!Utils.validPacket(packet)) {

                log.error('Non-existent packet received: ' + packet + ' data: ');
                log.error(message);

                return;
            }

            self.player.refreshTimeout();

            switch(packet) {

                case Packets.Intro:
                    self.handleIntro(message);
                    break;

                case Packets.Ready:
                    self.handleReady(message);
                    break;

                case Packets.Who:
                    self.handleWho(message);
                    break;

                case Packets.Equipment:
                    self.handleEquipment(message);
                    break;

                case Packets.Movement:
                    self.handleMovement(message);
                    break;

                case Packets.Request:
                    self.handleRequest(message);
                    break;

                case Packets.Target:
                    self.handleTarget(message);
                    break;

                case Packets.Combat:
                    self.handleCombat(message);
                    break;

                case Packets.Projectile:
                    self.handleProjectile(message);
                    break;

                case Packets.Network:
                    self.handleNetwork(message);
                    break;

                case Packets.Chat:
                    self.handleChat(message);
                    break;

                case Packets.Inventory:
                    self.handleInventory(message);
                    break;

                case Packets.Bank:
                    self.handleBank(message);
                    break;

                case Packets.Respawn:
                    self.handleRespawn(message);
                    break;

                case Packets.Trade:
                    self.handleTrade(message);
                    break;

                case Packets.Enchant:
                    self.handleEnchant(message);
                    break;

                case Packets.Click:
                    self.handleClick(message);
                    break;

                case Packets.Warp:
                    self.handleWarp(message);
                    break;

                case Packets.Shop:
                    self.handleShop(message);
                    break;

            }

        });
    },

    handleIntro: function(message) {
        console.log(message);
        var self = this,
            gameLoginToken = message.shift(),
            gxcAccountName = message.shift();
            // loginType = message.shift(),
            // username = message.shift().toLowerCase(),
            // password = message.shift(),
            // isRegistering = loginType === Packets.IntroOpcode.Register,
            // email = isRegistering ? message.shift() : '';

        self.intro(gxcAccountName, gameLoginToken);
    },

    intro: function(gxcAccountName, gameLoginToken) {
        var self = this;
        self.player.username = gxcAccountName.trim();
        self.player.password = gxcAccountName.trim();

        if (self.introduced)
            return;        

        if (config.overrideAuth) {
            self.mysql.login(self.player);
            return;
        }

        if (config.offlineMode) {
            var creator = new Creator(null);

            self.player.isNew = true;
            self.player.load(creator.getPlayerData(self.player));
            self.player.isNew = false;
            self.player.intro();

            return;
        }

        self.introduced = true;
        gxc.loginVerify(gxcAccountName, gameLoginToken)
        .then(function(res) {
	    console.log('login verify success: ');
	    console.log(res.data);
            if (self.world.playerInWorld(self.player.username)) {
		console.log('already loggedin user: ' + self.player.username);
                self.connection.sendUTF8('loggedin');
                self.connection.close('Player already logged in..');
                return;
            }
            const symbol = 'GOLD';
            return gxc.getBalance(self.player.username, 'GOLD')
            .then(function (response) {
                console.log(response.data);
                const data = {
                    selector: ['GOLD'],
                    params: { username: self.player.username }
                }
                self.mysql.selectData('player_wallet', data, function(error, rows, fields) {
                    if (error) throw error;
                    const balance = parseInt(response.data.balance || 0);
                    var type = 'INSERT INTO';
                    if (rows.length > 0) {
                        type = 'UPDATE IGNORE';
                        var info = rows.shift();
                        if (balance !== info.GOLD) {
                            console.error('balance not matching to wallet');
                        }
                    }
                    const accessData = {
                        username: self.player.username,
                        accessTime: new Date(),
                        accessToken: 'accessToken',
                        GOLD: balance,
                    };
                    self.mysql.queryData(type, 'player_wallet', accessData);
                });
            })
            .catch(function(error) {
                console.log('error at loading balance..');
                console.error(error.response.data.error)
                console.error(error);
		if(error && error.response) console.error(error.response.data);
            });
        })
        .then(function() {
            self.mysql.login(self.player, function(result) {
                if (result.notfounduser) {
                    self.connection.sendUTF8('invalidlogin');
                    self.connection.close('Not Found User: ' + self.player.username);
                } else if (result.wrongpassword) {
                    self.connection.sendUTF8('invalidlogin');
                    self.connection.close('Wrong password entered for: ' + self.player.username);
                } else if (result.userexists) {
                    self.connection.sendUTF8('userexists');
                    self.connection.close('Username not available.');
                } else if (result.emailexists) {
                    self.connection.sendUTF8('emailexists');
                    self.connection.close('Email not available.');
                }
            });

        }).catch(function(err) {
            console.error(err);
            self.connection.sendUTF8('invalidlogin');
            // self.connection.close('Error at login verify.');
        })

 

        // if (isRegistering) {
        //     self.mysql.register(self.player, function(result) {
        //         if (result.userexists) {
        //             self.connection.sendUTF8('userexists');
        //             self.connection.close('Username not available.');
        //         } else if (result.emailexists) {
        //             self.connection.sendUTF8('emailexists');
        //             self.connection.close('Email not available.');
        //         }
        //     });
        // } else {
        // }
    },

    handleReady: function(message) {
        var self = this,
            isReady = message.shift();

        if (!isReady)
            return;

        self.player.ready = true;

        self.world.handleEntityGroup(self.player);
        self.world.pushEntities(self.player);

        self.player.sendEquipment();
        self.player.loadInventory();
        self.player.loadBank();
        self.player.loadQuests();
        self.player.loadWallet();

        self.player.handler.detectMusic();

        self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'Player Count Command: /players'));
        self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'Global Chat Command: /global [text]'));
        self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'There are currently ' + self.world.getPopulation() + ' online.'));

        self.player.handler.detectPVP(self.player.x, self.player.y, true);
        self.player.handler.checkAttendance();

        if (self.player.readyCallback)
            self.player.readyCallback();
    },

    handleWho: function(message) {
        var self = this;

        _.each(message.shift(), function(id) {
            var entity = self.world.getEntityByInstance(id);

            if (entity && entity.id)
                self.player.send(new Messages.Spawn(entity));

        });
    },

    handleEquipment: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {

            case Packets.EquipmentOpcode.Unequip:
                var type = message.shift();

                if (!self.player.inventory.hasSpace()) {
                    self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'You do not have enough space in your inventory.'));
                    return;
                }

                switch (type) {
                    case 'weapon':

                        if (!self.player.hasWeapon())
                            return;

                        self.player.inventory.add(self.player.weapon.getItem());
                        self.player.setWeapon(-1, -1, -1, -1);

                        break;

                    case 'armour':
                        if (self.player.hasArmour() && self.player.armour.id === 114)
                            return;

                        self.player.inventory.add(self.player.armour.getItem());
                        self.player.setArmour(114, 1, -1, -1);

                        break;

                    case 'pendant':

                        if (!self.player.hasPendant())
                            return;

                        self.player.inventory.add(self.player.pendant.getItem());
                        self.player.setPendant(-1, -1, -1, -1);

                        break;

                    case 'ring':

                        if (!self.player.hasRing())
                            return;

                        self.player.inventory.add(self.player.ring.getItem());
                        self.player.setRing(-1, -1, -1, -1);

                        break;

                    case 'boots':

                        if (!self.player.hasBoots())
                            return;

                        self.player.inventory.add(self.player.boots.getItem());
                        self.player.setBoots(-1, -1, -1, -1);

                        break;
                }

                self.player.send(new Messages.Equipment(Packets.EquipmentOpcode.Unequip, [type]));
                self.player.sync();

                break;
        }
    },

    handleMovement: function(message) {
        var self = this,
            opcode = message.shift();

        if (!self.player || self.player.dead)
            return;

        switch (opcode) {
            case Packets.MovementOpcode.Request:
                var requestX = message.shift(),
                    requestY = message.shift(),
                    playerX = message.shift(),
                    playerY = message.shift();

                if (playerX !== self.player.x || playerY !== self.player.y)
                    return;

                self.player.guessPosition(requestX, requestY);

                break;

            case Packets.Movement.Started:
                var selectedX = message.shift(),
                    selectedY = message.shift(),
                    pX = message.shift(),
                    pY = message.shift();

                if (pX !== self.player.x || pY !== self.player.y || self.player.stunned)
                    return;

                self.player.moving = true;

                break;

            case Packets.MovementOpcode.Step:
                var x = message.shift(),
                    y = message.shift();

                if (self.player.stunned)
                    return;

                self.player.setPosition(x, y);

                break;

            case Packets.MovementOpcode.Stop:
                var posX = message.shift(),
                    posY = message.shift(),
                    id = message.shift(),
                    hasTarget = message.shift(),
                    entity = self.world.getEntityByInstance(id);

                if (entity && entity.type === 'item' && !hasTarget)
                    self.player.inventory.add(entity);

                if (self.world.map.isDoor(posX, posY) && !hasTarget) {
                    var destination = self.world.map.getDoorDestination(posX, posY);

                    self.player.teleport(destination.x, destination.y, true);

                } else
                    self.player.setPosition(posX, posY);

                self.player.moving = false;
                self.player.lastMovement = new Date().getTime();

                break;

            case Packets.MovementOpcode.Entity:

                var instance = message.shift(),
                    entityX = message.shift(),
                    entityY = message.shift(),
                    oEntity = self.world.getEntityByInstance(instance);

                if (!oEntity || (oEntity.x === entityX && oEntity.y === entityY))
                    return;

                oEntity.setPosition(entityX, entityY);

                if (oEntity.hasTarget())
                    oEntity.combat.forceAttack();

                break;

            case Packets.MovementOpcode.Orientate:
                var orientation = message.shift();
                self.world.pushToAdjacentGroups(self.player.group, new Messages.Movement(Packets.MovementOpcode.Orientate, [self.player.instance, orientation]) );

                break;
        }
    },

    handleRequest: function(message) {
        var self = this,
            id = message.shift();

        if (id !== self.player.instance)
            return;

        self.world.pushEntities(self.player);
    },

    handleTarget: function(message) {
        var self = this,
            opcode = message.shift(),
            instance = message.shift();

        log.debug('Targeted: ' + instance);

        switch (opcode) {

            case Packets.TargetOpcode.Talk:
                var entity = self.world.getEntityByInstance(instance);

                if (!entity)
                    return;

                if (entity.type === 'chest') {
                    entity.openChest();
                    return;
                }

                if (entity.dead)
                    return;

                if (self.player.npcTalkCallback)
                    self.player.npcTalkCallback(entity);

                break;

            case Packets.TargetOpcode.Attack:

                var target = self.world.getEntityByInstance(instance);

                if (!target || target.dead || !self.canAttack(self.player, target)) {
                    var playerTarget = self.world.getEntityByInstance(self.player.instance);
                    self.world.pushToAdjacentGroups(playerTarget.group, new Messages.Combat(Packets.CombatOpcode.Initiate, self.player.instance, null));
                } else {
                    self.world.pushToAdjacentGroups(target.group, new Messages.Combat(Packets.CombatOpcode.Initiate, self.player.instance, target.instance)); 
                }

                break;

            case Packets.TargetOpcode.None:

                self.player.combat.stop();
                self.player.removeTarget();

                break;
        }
    },

    handleCombat: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {
            case Packets.CombatOpcode.Initiate:
                var attacker = self.world.getEntityByInstance(message.shift()),
                    target = self.world.getEntityByInstance(message.shift());

                if (!target || target.dead || !attacker || attacker.dead || !self.canAttack(attacker, target))
                    return;

                attacker.setTarget(target);

                if (!attacker.combat.started)
                    attacker.combat.forceAttack();
                else {

                    // attacker.combat.start();

                    attacker.combat.attack(target);

                }

                if (target.combat)
                    target.combat.addAttacker(attacker);

                break;
        }
    },

    handleProjectile: function(message) {
        var self = this,
            type = message.shift();

        switch (type) {
            case Packets.ProjectileOpcode.Impact:
                var projectile = self.world.getEntityByInstance(message.shift()),
                    target = self.world.getEntityByInstance(message.shift());

                if (!target || target.dead || !projectile)
                    return;

                self.world.handleDamage(projectile.owner, target, projectile.damage);
                self.world.removeProjectile(projectile);

                if (target.combat.started || target.dead || target.type !== 'mob')
                    return;

                target.begin(projectile.owner);

                break;
        }
    },

    handleNetwork: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {
            case Packets.NetworkOpcode.Pong:
                log.info('Pingy pongy pung pong.');
                break;
        }
    },

    handleChat: function(message) {
        var self = this,
            text = sanitizer.escape(sanitizer.sanitize(message.shift()));

        if (!text || text.length < 1 || !(/\S/.test(text)))
            return;

        if (text.charAt(0) === '/' || text.charAt(0) === ';')
            self.commands.parse(text);
        else {

            if (self.player.isMuted()) {
                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'You are currently muted.'));
                return;
            }

            if (!self.player.canTalk) {
                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'You are not allowed to talk for the duration of this event.'));
                return;
            }

            self.world.pushToGroup(self.player.group, new Messages.Chat({
                id: self.player.instance,
                name: self.player.username,
                withBubble: true,
                text: text,
                duration: 7000
            }));
        }

    },

    handleInventory: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {
            case Packets.InventoryOpcode.Remove:
                var item = message.shift(),
                    count;

                if (!item)
                    return;

                if (item.count > 1)
                    count = message.shift();

                var id = Items.stringToId(item.string),
                    iSlot = self.player.inventory.slots[item.index];

                if (count > iSlot.count)
                    count = iSlot.count;

                self.player.inventory.remove(id, count ? count : item.count, item.index);

                self.world.dropItem(id, count, self.player.x, self.player.y);

                break;

            case Packets.InventoryOpcode.Select:
                var index = message.shift(),
                    slot = self.player.inventory.slots[index],
                    string = slot.string,
                    sCount = slot.count,
                    ability = slot.ability,
                    abilityLevel = slot.abilityLevel;

                if (!slot)
                    return;

                id = Items.stringToId(slot.string);

                if (slot.equippable) {

                    if (!self.player.canEquip(string))
                        return;

                    self.player.inventory.remove(id, slot.count, slot.index);

                    self.player.equip(string, sCount, ability, abilityLevel);

                } else if (slot.edible) {

                    self.player.inventory.remove(id, 1, slot.index);

                    self.player.eat(id);

                }

                break;
        }
    },

    handleBank: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {
            case Packets.BankOpcode.Select:
                var type = message.shift(),
                    index = message.shift(),
                    isBank = type === 'bank';

                if (isBank) {
                    var bankSlot = self.player.bank.slots[index];

                    //Infinite stacks move all at onces, otherwise move one by one.
                    var moveAmount = Items.maxStackSize(bankSlot.id) === -1 ? bankSlot.count : 1;

                    if (self.player.inventory.add(bankSlot,moveAmount))
                        self.player.bank.remove(bankSlot.id, moveAmount, index);

                } else {
                    var inventorySlot = self.player.inventory.slots[index];

                    if (self.player.bank.add(inventorySlot.id, inventorySlot.count, inventorySlot.ability, inventorySlot.abilityLevel))
                        self.player.inventory.remove(inventorySlot.id, inventorySlot.count, index);
                }

                break;
        }
    },

    handleRespawn: function(message) {
        var self = this,
            instance = message.shift();

        if (self.player.instance !== instance)
            return;

        var spawn = self.player.getSpawn();

        self.player.dead = false;
        self.player.setPosition(spawn.x, spawn.y);

        self.world.pushToAdjacentGroups(self.player.group, new Messages.Spawn(self.player), self.player.instance);
        self.player.send(new Messages.Respawn(self.player.instance, self.player.x, self.player.y));

        self.player.revertPoints();
    },

    handleTrade: function(message) {
        var self = this,
            opcode = message.shift(),
            oPlayer = self.world.getEntityByInstance(message.shift());

        if (!oPlayer || !opcode)
            return;

        switch (opcode) {
            case Packets.TradeOpcode.Request:


                break;

            case Packets.TradeOpcode.Accept:

                break;

            case Packets.TradeOpcode.Decline:

                break;
        }
    },

    handleEnchant: function(message) {
        var self = this,
            opcode = message.shift();

        switch (opcode) {
            case Packets.EnchantOpcode.Select:
                var index = message.shift(),
                    item = self.player.inventory.slots[index],
                    type = 'item';

                if (Items.isShard(item.id))
                    type = 'shards';

                self.player.enchant.add(type, item);

                break;

            case Packets.EnchantOpcode.Remove:

                self.player.enchant.remove(message.shift());

                break;

            case Packets.EnchantOpcode.Enchant:

                self.player.enchant.enchant();

                break;
        }
    },

    handleClick: function(message) {
        var self = this,
            type = message.shift(),
            isOpen = message.shift();

        switch (type) {
            case 'profile':
                if (self.player.profileToggleCallback)
                    self.player.profileToggleCallback(isOpen);
                break;
            case 'inventory':
                if (self.player.inventoryToggleCallback)
                    self.player.inventoryToggleCallback(isOpen);
                break;
            case 'token':
                if (self.player.tokenToggleCallback)
                    self.player.tokenToggleCallback(isOpen);
                break;
        }
    },

    handleWarp: function(message) {
        var self = this,
            id = parseInt(message.shift()) - 1;

        if (self.player.warp)
            self.player.warp.warp(id);
    },

    handleShop: function(message) {
        var self = this,
            opcode = message.shift(),
            shopId = message.shift();

        switch (opcode) {
            case Packets.ShopOpcode.Buy:
                var buyId = message.shift(),
                    amount = message.shift();

                if (!buyId || !amount) {
                    self.player.notify('Incorrect purchase relay.');
                    return;
                }

                log.info('Received Buy: ' + buyId + ' ' + amount);

                self.world.shops.buy(self.player, shopId, buyId, amount);

                break;
        }
    },

    canAttack: function(attacker, target) {

        /**
         * Used to prevent client-sided manipulation. The client will send the packet to start combat
         * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
         */

        if (attacker.type === 'mob' || target.type === 'mob')
            return true;

        return attacker.type === 'player' && target.type === 'player' && attacker.pvp && target.pvp;
    }

});
