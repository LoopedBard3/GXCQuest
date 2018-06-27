var Quest = require('../quest'),
    Messages = require('../../../../../../network/messages'),
    Packets = require('../../../../../../network/packets');

module.exports = FindGXMan = Quest.extend({

    init: function(player, data) {
        var self = this;

        self.player = player;
        self.data = data;

        self.lastNPC = null;

        self._super(player, data);
        self.loadCallbacks();
    },

    load: function(stage) {
        var self = this;

        if (!stage)
            self.update();
        else
            self.stage = stage;

        self.loadCallbacks();
    },

    loadCallbacks: function() {
        var self = this;

        if (self.stage > 9999)
            return;

        self.updatePointers();

        self.onNPCTalk(function(npc) {
            var conversation = self.getConversation(npc.id);

            self.lastNPC = npc;

            npc.talk(conversation);

            self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: conversation
            }));

            if (npc.talkIndex > conversation.length)
                self.progress('talk');
        });

        self.player.onToken(function(isOpen) {
            if (isOpen)
                self.progress('click');
        });
    },

    progress: function(type) {
        var self = this,
            task = self.data.task[self.stage];

        if (!task || task !== type)
            return;

        if (self.stage === self.data.stages) {
            self.finish();
            return;
        }

        self.resetTalkIndex(self.lastNPC);

        self.clearPointers();
        self.stage++;

        self.update();
        self.updatePointers();

        self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
            id: self.id,
            stage: self.stage,
            isQuest: true
        }));
    },

    finish: function() {
        this._super();
    }
});