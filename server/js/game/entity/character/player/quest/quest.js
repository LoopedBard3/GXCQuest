var cls = require('../../../../../lib/class'),
    Messages = require('../../../../../network/messages'),
    Packets = require('../../../../../network/packets'),
    Utils = require('../../../../../util/utils'),
    Items = require('../../../../../util/items');

module.exports = Quest = cls.Class.extend({

    init: function(player, data) {
        var self = this;

        self.player = player;
        self.data = data;

        self.id = data.id;
        self.name = data.name;
        self.description = data.description;

        self.stage = 0;
    },

    finish: function() {
        var self = this;

        if (self.hasItemReward()) {
            var item = self.getItemReward();

            if (item) {
                if (self.hasInventorySpace(item.id, item.count)) {
                    self.player.inventory.add({ id: item.id, count: item.count });
                    self.player.notify(`You got ${item.count > 1 ? item.count+' ':''}${Items.idToName(item.id)}`);
                } else {
                    self.player.notify('You do not have enough space in your inventory.');
                    self.player.notify('Please make room prior to finishing the quest.');

                    return;
                }
            }
        }

        self.setStage(9999);

        self.player.send(new Messages.Quest(Packets.QuestOpcode.Finish, {
            id: self.id,
            isQuest: true
        }));
        self.player.notify(`You have completed the '${self.name}' Quest`);
    },

    isFinished: function() {
        return this.stage >= 9999;
    },

    setStage: function(stage) {
        var self = this;

        self.stage = stage;
        self.update();
    },

    hasMob: function() {
        return false;
    },

    triggerTalk: function(npc) {
        var self = this;

        if (self.npcTalkCallback)
            self.npcTalkCallback(npc);
    },

    onNPCTalk: function(callback) {
        this.npcTalkCallback = callback;
    },

    hasNPC: function(id) {
        return this.data.npcs.indexOf(id) > -1;
    },

    update: function() {
        this.player.save();
    },

    updatePointers: function() {
        var self = this;

        if (!self.data.pointers)
            return;

        var pointer = self.data.pointers[self.stage];

        if (!pointer)
            return;

        var opcode = pointer[0],
            x = pointer[1],
            y = pointer[2];

        self.player.send(new Messages.Pointer(opcode, {
            id: Utils.generateRandomId(),
            x: x,
            y: y
        }));
    },

    forceTalk: function(npc, message) {
        var self = this;

        if (!npc)
            return;

        npc.talkIndex = 0;

        self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
            id: npc.instance,
            text: message
        }));
    },

    resetTalkIndex: function(npc) {
        var self = this;

        /**
         * Ensures that an NPC does not go off the conversation
         * index and is resetted in order to start a new chat
         */

        if(!npc)
            return;

        npc.talkIndex = 0;

        self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
            id: npc.instance,
            text: null
        }));
    },

    clearPointers: function() {
        this.player.send(new Messages.Pointer(Packets.PointerOpcode.Remove, {}))
    },

    getConversation: function(id) {
        var self = this,
            conversation = self.data.conversations[id];

        if (!conversation || !conversation[self.stage])
            return [''];

        return conversation[self.stage];
    },

    hasItemReward: function() {
        return !!this.data.itemReward;
    },

    getTask: function() {
        return this.data.task[this.stage];
    },

    getId: function() {
        return this.id;
    },

    getName: function() {
        return this.name;
    },

    getDescription: function() {
        return this.description;
    },

    getStage: function() {
        return this.stage;
    },

    getItem: function() {
        return this.data.itemReq ? this.data.itemReq[this.stage] : null;
    },

    getItemReward: function() {
        if (this.hasItemReward()) {
            this.data.itemReward.name = Items.idToString(this.data.itemReward.id);
            return this.data.itemReward;
        }
        return null;
    },

    hasInventorySpace: function(id, count) {
        return this.player.inventory.canHold(id, count);
    },

    getInfo: function() {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            reward: this.getItemReward(),
            stage: this.getStage(),
            finished: this.isFinished(),
            isQuest: true
        };
    }

});