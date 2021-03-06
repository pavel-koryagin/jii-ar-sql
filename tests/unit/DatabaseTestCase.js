
'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');
require('./bootstrap');

var fs = require('fs');
var config = require('./config');

var tests = Jii.namespace('tests');

/**
 * @class tests.unit.DatabaseTestCase
 * @extends Jii.base.UnitTest
 */
var self = Jii.defineClass('tests.unit.DatabaseTestCase', {

	__extends: 'Jii.base.UnitTest',

	database: null,
	driverName: 'mysql',

	/**
	 * @type {Jii.sql.Connection}
	 */
	db: null,

	setUp: function () {
		this.database = Jii._.clone(config[this.driverName]);

		this.mockApplication();

		return this.__super();
	},

	tearDown: function () {
		if (this.db) {
			this.db.close();
		}
		this.destroyApplication();

		return this.__super();
	},

	/**
	 * @param {boolean} [reset] whether to clean up the test database
	 * @param {boolean} [open]  whether to open and populate test database
	 * @returns {Jii.sql.Connection}
	 */
	getConnection: function (reset, open) {
		reset = !Jii._.isUndefined(reset) ? reset : true;
		open = !Jii._.isUndefined(open) ? open : true;

		if (!reset && this.db && this.db.getIsActive()) {
			return Promise.resolve(this.db);
		}

		if (this.db) {
			this.db.close();
		}

		var fixture = null;
		var config = this.database;

		if (config.fixture) {
			fixture = config.fixture;
			delete config.fixture;
		}

		return this.prepareDatabase(config, fixture, open).then(function(db) {
			this.db = db;
			return this.db;
		}.bind(this));
	},

	prepareDatabase: function (config, fixture, open) {
		open = open || true;

		var db = Jii.createObject(config);
		if (!open) {
			return Promise.resolve(db);
		}

		return db.open().then(function() {
			return new Promise(function(resolve, reject) {
				if (fixture === null) {
					resolve(db);
					return;
				}

				var lines = fs.readFileSync(fixture).toString().split(';');
				var i = -1;
				var execLine = function() {
					i++;
					if (i === lines.length) {
						resolve(db);
						return;
					}

					var sql = lines[i];
					if (Jii._s.trim(sql) !== '') {
						db.exec(sql).then(execLine, execLine);
					} else {
						execLine();
					}
				};
				execLine();
			});
		});
	}

});

module.exports = new self().exports();
