define(['jquery', '../page'], function($, Page) {

    return Page.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;
            self.interface = interface;

            self._super('#questPage');

            self.achievements = $('#achievementList');
            self.quests = $('#questList');

            self.achievementsCount = $('#achievementCount');
            self.questCount = $('#questCount');

            self.achievementsList = self.achievements.find('ul');
            self.questList = self.quests.find('ul');

        },

        load: function(quests = [], achievements = []) {
            var self = this,
                finishedAchievements = 0,
                finishedQuests = 0;

            _.each(achievements, function(achievement) {
                var item = self.getItem(false, achievement.id),
                    name = self.getName(false, achievement.id);

                name.text('(?) ' + achievement.name);

                name.css('background', 'rgba(255, 10, 10, 0.3)');

                if (achievement.progress > 0 && achievement.progress < 9999) {
                    name.css('background', 'rgba(255, 255, 10, 0.4)');

                    name.text(achievement.name + (achievement.count > 2 ? ' ' + (achievement.progress - 1) + '/' + (achievement.count - 1) : ''));

                } else if (achievement.progress > 9998) {
                    name.text(achievement.name);
                    name.css('background', 'rgba(10, 255, 10, 0.3)');
                }

                item.click(function() {                
                    var $title = $('<h1 class="name"></h1>').text(achievement.name);
                    var $description = $('<p class="description"></p>').text(achievement.description);
                    var $wrapper = $('<div></div>');
                    $wrapper.append($title).append($description);
                    if (achievement.count > 2) {
                        $title.append(' ' + (achievement.progress - 1) + '/' + (achievement.count - 1))
                    }
                    if (achievement.reward) {
                        var $reward = $('<div class="reward"></div>');
                        if (achievement.reward.rewardType === Modules.RewardType.Experience || achievement.reward.rewardType === Modules.RewardType.ItemAndExperience) {
                            $reward.append(achievement.reward.exp + 'exp');
                        }
                        if (achievement.reward.rewardType === Modules.RewardType.Item || achievement.reward.rewardType === Modules.RewardType.ItemAndExperience) {
                            var $itemImage = $('<span class="itemImage"></span>');
                            $itemImage.css('background-image', self.getImageFormat(self.getScale(), achievement.reward.itemName));
                            $reward.append($itemImage);
                            if(achievement.reward.itemCount > 1) {
                                $reward.append(achievement.reward.itemCount);
                            }
                        }
                        $wrapper.append($reward);
                    }
                    self.interface.displayNotify($wrapper);
                });

                if (achievement.finished)
                    finishedAchievements++;

                item.append(name);

                var listItem = $('<li></li>');

                listItem.append(item);

                self.achievementsList.append(listItem);
            });

            _.each(quests, function(quest) {
                var item = self.getItem(true, quest.id),
                    name = self.getName(true, quest.id);

                name.text(quest.name);

                name.css('background', 'rgba(255, 10, 10, 0.3)');

                if (quest.stage > 0 && quest.stage < 9999)
                    name.css('background', 'rgba(255, 255, 10, 0.4)');
                else if (quest.stage > 9998)
                    name.css('background', 'rgba(10, 255, 10, 0.3)');

                if (quest.finished)
                    finishedQuests++;

                item.append(name);

                item.click(function() {
                    var $title = $('<h1 class="name"></h1>').text(quest.name);
                    var $description = $('<p class="description"></p>').text(quest.description);
                    var $wrapper = $('<div></div>');
                    $wrapper.append($title).append($description);
                    if (quest.reward) {
                        var $reward = $('<div class="reward"></div>');
                        var $itemImage = $('<span class="itemImage"></span>');
                        $itemImage.css('background-image', self.getImageFormat(self.getScale(), quest.reward.name));
                        $reward.append($itemImage);
                        if(quest.reward.count > 1) {
                            $reward.append(quest.reward.count);
                        }
                        $wrapper.append($reward);
                    }
                    self.interface.displayNotify($wrapper);
                });

                var listItem = $('<li></li>');

                listItem.append(item);

                self.questList.append(listItem);
            });

            self.achievementsCount.html(finishedAchievements + '/' + achievements.length);
            self.questCount.html(finishedQuests + '/' + quests.length);

        },

        progress: function(info) {
            var self = this,
                item = info.isQuest ? self.getQuest(info.id) : self.getAchievement(info.id);

            if (!item)
                return;

            var name = item.find('' + (info.isQuest ? '#quest' : '#achievement') + info.id + 'name');

            if (!name)
                return;

            if (!info.isQuest && info.count > 2)
                name.text(info.name + ' ' + (info.progress - 1) + '/' + (info.count - 1));

            name.css('background', 'rgba(255, 255, 10, 0.4)');

            item.off('click');
            item.click(function() {
                if (info.isQuest || info.progress > 0) {
                    var $title = $('<h1 class="name"></h1>').text(info.name);
                    var $description = $('<p class="description"></p>').text(info.description);
                    var $wrapper = $('<div></div>');
                    $wrapper.append($title).append($description);
                    if (info.isQuest) {
                        if (info.reward) {
                            var $reward = $('<div class="reward"></div>');
                            var $itemImage = $('<span class="itemImage"></span>');
                            $itemImage.css('background-image', self.getImageFormat(self.getScale(), info.reward.name));
                            $reward.append($itemImage);
                            if(info.reward.count > 1) {
                                $reward.append(info.reward.count);
                            }
                            $wrapper.append($reward);
                        }
                    } else {
                        if (info.count > 2) {
                            $title.append(' ' + (info.progress - 1) + '/' + (info.count - 1));
                        }
                        if (info.reward) {
                            var $reward = $('<div class="reward"></div>');
                            if (info.reward.rewardType === Modules.RewardType.Experience || info.reward.rewardType === Modules.RewardType.ItemAndExperience) {
                                $reward.append(info.reward.exp + 'exp');
                            }
                            if (info.reward.rewardType === Modules.RewardType.Item || info.reward.rewardType === Modules.RewardType.ItemAndExperience) {
                                var $itemImage = $('<span class="itemImage"></span>');
                                $itemImage.css('background-image', self.getImageFormat(self.getScale(), info.reward.itemName));
                                $reward.append($itemImage);
                                if(info.reward.itemCount > 1) {
                                    $reward.append(info.reward.itemCount);
                                }
                            }
                            $wrapper.append($reward);
                        }
                    }
                    self.interface.displayNotify($wrapper);
                }
            });
        },

        finish: function(info) {
            var self = this,
                item = info.isQuest ? self.getQuest(info.id) : self.getAchievement(info.id);

            if (!item)
                return;

            var name = item.find('' + (info.isQuest ? '#quest' : '#achievement') + info.id + 'name');

            if (!name)
                return;

            if (!info.isQuest)
                name.text(info.name);

            name.css('background', 'rgba(10, 255, 10, 0.3)');

        },

        getQuest: function(id) {
            return $(this.questList.find('li')[id]).find('#quest' + id);
        },

        getAchievement: function(id) {
            return $(this.achievementsList.find('li')[id]).find('#achievement' + id);
        },


        /**
         * Might as well properly organize them based
         * on their type of item and id (index).
         */

        getItem: function(isQuest, id) {
            return $('<div id="' + (isQuest ? 'quest' : 'achievement') + id + '" class="questItem"></div>');
        },

        getName: function(isQuest, id) {
            return $('<div id="' + (isQuest ? 'quest' : 'achievement') + id + 'name" class="questName"></div>')
        }

    });

});
