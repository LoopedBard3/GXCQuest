/* global log */

var cls = require('../lib/class'),
    mysql = require('mysql'),
    Creator = require('./creator'),
    _ = require('underscore'),
    Loader = require('./loader'),
    Config = require('../../config.json'),
    hash = require('object-hash');

module.exports = MySQL = cls.Class.extend({

    init: function(host, port, user, pass, database) {
        var self = this;

        /**
         * Main file for MySQL, it splits into Creator and Loader.
         * Responsible for creating and loading data, respectively.
         */

        self.host = host;
        self.port = port;
        self.user = user;
        self.password = pass;
        self.database = database;

        self.loader = null;

        self.connect(true, false);
		
		self.loadCreator();
        self.loadCallbacks();
        
    },

    connect: function(usingDB, forceCallbacks) {
        var self = this;

        if (self.connection) {
            self.connection.destroy();
            self.connection = null;
        }

        self.connection = mysql.createConnection({
            host: self.host,
            port: self.port,
            user: self.user,
            password: self.password,
            database: usingDB ? self.database : null
        });

        if (forceCallbacks)
            self.loadCallbacks();
    },

    loadCallbacks: function() {
        var self = this;

        self.connection.connect(function(err) {
            if (err) {
                log.info('[MySQL] No database found...');
                self.connect(false, false);
                self.loadDatabases();
                return;
            }

			      // self.creator.createTables();
            log.info('Successfully established connection to the MySQL database!');
            self.loader = new Loader(self);
        });

        self.connection.on('error', function(error) {
            log.error('MySQL database disconnected.');

            self.connect(true, true);
        });

        // self.onSelected(function() {
        //     self.creator.createTables();
        // });
    },

    loadCreator: function() {
        var self = this;

        if (self.creator)
            return;

        self.creator = new Creator(self);
    },

    login: function(player, callback) {
        var self = this,
            found;

        log.info('Initiating login for: ' + player.username);

        self.connection.query('SELECT * FROM `player_data`, `player_equipment` WHERE `player_data`.`username`= ?', [player.username],  function(error, rows, fields) {
            if (error) {
                log.error(error);
                throw error;
            }

            _.each(rows, function(row) {
                if (row.username === player.username) {
                    if (row.password !== player.password) {
                        callback({ wrongpassword: true });
                    } else {
                        found = true;

                        var data = row;

                        data.armour = data.armour.split(',').map(Number);
                        data.weapon = data.weapon.split(',').map(Number);
                        data.pendant = data.pendant.split(',').map(Number);
                        data.ring = data.ring.split(',').map(Number);
                        data.boots = data.boots.split(',').map(Number);

                        player.load(data);
                        player.intro();
                    }
                }
            });

            if (!found) {
                // callback({ notfounduser: true });
                self.register(player, callback);
            }
        });
    },

    register: function(player, callback) {
        var self = this;

        self.connection.query('SELECT `player_data`.`username`, `player_data`.`email` FROM `player_data` WHERE `player_data`.`username`= ? or `player_data`.`email`= ?', [player.username, player.email], function(error, rows, fields) {
            var exists;

            if (error) console.log(error);

            _.each(rows, function(row) {
                if (row.username === player.username) {
                    exists = true;
                    if(callback) callback({ userexists: true });
                } else if (row.email === player.email) {
                    exists = true;
                    if(callback) callback({ emailexists: true });
                }
            });

            if (!exists) {
                log.info('No player data found. Creating new player data for: ' + player.username);

                player.isNew = true;
                const password = player.password;
                player.load(self.creator.getPlayerData(player));

                self.creator.save({ ...player, password }, false);

                player.isNew = false;
                player.intro();
            }
        });
    },
    

    delete: function(player) {
        var self = this,
            databases = ['player_data', 'player_equipment', 'player_inventory', 'player_abilities', 'player_bank', 'player_quests', 'player_achievements'];

        _.each(databases, function(db) {
            self.connection.query('DELETE FROM `' + db + '` WHERE `' + db + '`.`' + 'username`=?',[player.username], function(error) {
                if (error)
                    log.error('Error while deleting user: ' + player.username);
            });
        });
    },

    loadDatabases: function() {
        var self = this;

		log.info('[MySQL] Creating database....');

        self.connection.query('CREATE DATABASE IF NOT EXISTS ' + Config.mysqlDatabase, function(error, results, fields) {
            if (error)
                throw error;

            log.info('[MySQL] Successfully created database.');

            self.connection.query('USE ' + Config.mysqlDatabase);
        });
    },

    selectData: function(database, data, callback) {
        var self = this;
        
        let select = 'SELECT';
        let query = ` FROM ${database} WHERE 1=1`;
        let params = [];
        let selector = '';
        if (data.selector) {
            for (var key in data.selector) {
                selector += `, \`${database}\`.\`${data.selector[key]}\``;
            }
            select += selector.slice(1);
        } else {
            select += " *";
        }
        query = select + query;
        if (data.params) {
            for (var key in data.params) {
                query += ` AND \`${database}\`.\`${key}\`=?`;
                params.push(data.params[key]);
            }
        }

        self.connection.query(query, params, callback);
    },

    queryData: function(type, database, data, callback) {
        var self = this;

        self.connection.query(type + ' ' + database + ' SET ?', data, function(error, rows, fields) {
            if (error)
                throw error;
            
            log.info('Successfully updated ' + database);
            if (callback) callback(error, rows, fields);
        });
    },

    alter: function(database, column, type) {
        var self = this;

        self.connection.query('ALTER TABLE ' + database + ' ADD ' + column + ' ' + type, function(error, results, fields) {
            if (error) {
                log.error('Malformation in the database type and/or type.');
                return;
            }

            log.info('Database ' + database + ' has been successfully altered.');
        });
    },

    // onSelected: function(callback) {
    //     this.selectDatabase_callback = callback;
    // }

});