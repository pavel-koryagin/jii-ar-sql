'use strict';

/**
 * @namespace Jii
 * @ignore
 */
var Jii = require('jii');

require('./Command');

/**
 * @class Jii.sql.remote.ActiveRecordAction
 * @extends Jii.base.Action
 */
Jii.defineClass('Jii.sql.remote.ActiveRecordAction', /** @lends Jii.sql.remote.ActiveRecordAction.prototype */{

    __extends: 'Jii.base.Action',

    /**
     * Runs this action with the specified parameters.
     * This method is mainly invoked by the controller.
     * @param {Jii.base.Context} context
     * @returns {*} the result of the action
     */
    runWithParams: function (context) {
        /** @type {Jii.sql.ActiveRecord} modelClass */
        var modelClass = Jii.namespace(context.request.get('modelClassName'));

        switch (context.request.get('method')) {
            case Jii.sql.remote.Command.METHOD_INSERT:
                var model = new modelClass();
                model.setAttributes(context.request.get('values'));
                return model.save().then(function(success) {
                    return {
                        attributes: success ? model.getAttributes() : null,
                        errors: model.getErrors()
                    };
                });

            case Jii.sql.remote.Command.METHOD_UPDATE:
                return modelClass.findOne(context.request.get('primaryKey')).then(function(model) {
                    if (!model) {
                        return {
                            success: false,
                            errors: {}
                        };
                    }

                    model.setAttributes(context.request.get('values'));
                    return model.save().then(function(success) {
                        return {
                            success: success,
                            errors: model.getErrors()
                        };
                    })
                });

            case Jii.sql.remote.Command.METHOD_DELETE:
                return modelClass.findOne(context.request.get('primaryKey')).then(function(model) {
                    return model ? model.delete() : false;
                }).then(function(success) {
                    return {
                        success: success
                    };
                });
        }

        throw new Jii.exceptions.InvalidParamException('Unknown method `' + context.request.get('method') + '` in ' + this.className());
    }


});