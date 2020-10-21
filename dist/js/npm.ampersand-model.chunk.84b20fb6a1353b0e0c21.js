(window.webpackJsonp=window.webpackJsonp||[]).push([["npm.ampersand-model"],{"3bfc":function(module,exports,__webpack_require__){eval("/*$AMPERSAND_VERSION*/\nvar State = __webpack_require__(/*! ampersand-state */ \"ef45\");\nvar sync = __webpack_require__(/*! ampersand-sync */ \"bd2e\");\nvar assign = __webpack_require__(/*! lodash/assign */ \"5ad5\");\nvar isObject = __webpack_require__(/*! lodash/isObject */ \"d3a8\");\nvar clone = __webpack_require__(/*! lodash/clone */ \"559d\");\nvar result = __webpack_require__(/*! lodash/result */ \"80c9\");\n\n// Throw an error when a URL is needed, and none is supplied.\nvar urlError = function () {\n    throw new Error('A \"url\" property or function must be specified');\n};\n\n// Wrap an optional error callback with a fallback error event.\nvar wrapError = function (model, options) {\n    var error = options.error;\n    options.error = function (resp) {\n        if (error) error(model, resp, options);\n        model.trigger('error', model, resp, options);\n    };\n};\n\nvar Model = State.extend({\n    save: function (key, val, options) {\n        var attrs, method;\n\n        // Handle both `\"key\", value` and `{key: value}` -style arguments.\n        if (key == null || typeof key === 'object') {\n            attrs = key;\n            options = val;\n        } else {\n            (attrs = {})[key] = val;\n        }\n\n        options = assign({validate: true}, options);\n\n        // If we're not waiting and attributes exist, save acts as\n        // `set(attr).save(null, opts)` with validation. Otherwise, check if\n        // the model will be valid when the attributes, if any, are set.\n        if (attrs && !options.wait) {\n            if (!this.set(attrs, options)) return false;\n        } else {\n            if (!this._validate(attrs, options)) return false;\n        }\n\n        // After a successful server-side save, the client is (optionally)\n        // updated with the server-side state.\n        if (options.parse === void 0) options.parse = true;\n        var model = this;\n        var success = options.success;\n        options.success = function (resp) {\n            var serverAttrs = model.parse(resp, options);\n            if (options.wait) serverAttrs = assign(attrs || {}, serverAttrs);\n            if (isObject(serverAttrs) && !model.set(serverAttrs, options)) {\n                return false;\n            }\n            if (success) success(model, resp, options);\n            model.trigger('sync', model, resp, options);\n        };\n        wrapError(this, options);\n\n        method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');\n        if (method === 'patch') options.attrs = attrs;\n        // if we're waiting we haven't actually set our attributes yet so\n        // we need to do make sure we send right data\n        if (options.wait && method !== 'patch') options.attrs = assign(model.serialize(), attrs);\n        var sync = this.sync(method, this, options);\n\n        // Make the request available on the options object so it can be accessed\n        // further down the line by `parse`, attached listeners, etc\n        // Same thing is done below for fetch and destroy\n        // https://github.com/AmpersandJS/ampersand-collection-rest-mixin/commit/d32d788aaff912387eb1106f2d7ad183ec39e11a#diff-84c84703169bf5017b1bc323653acaa3R32\n        options.xhr = sync;\n        return sync;\n    },\n\n    // Fetch the model from the server. If the server's representation of the\n    // model differs from its current attributes, they will be overridden,\n    // triggering a `\"change\"` event.\n    fetch: function (options) {\n        options = options ? clone(options) : {};\n        if (options.parse === void 0) options.parse = true;\n        var model = this;\n        var success = options.success;\n        options.success = function (resp) {\n            if (!model.set(model.parse(resp, options), options)) return false;\n            if (success) success(model, resp, options);\n            model.trigger('sync', model, resp, options);\n        };\n        wrapError(this, options);\n        var sync = this.sync('read', this, options);\n        options.xhr = sync;\n        return sync;\n    },\n\n    // Destroy this model on the server if it was already persisted.\n    // Optimistically removes the model from its collection, if it has one.\n    // If `wait: true` is passed, waits for the server to respond before removal.\n    destroy: function (options) {\n        options = options ? clone(options) : {};\n        var model = this;\n        var success = options.success;\n\n        var destroy = function () {\n            model.trigger('destroy', model, model.collection, options);\n        };\n\n        options.success = function (resp) {\n            if (options.wait || model.isNew()) destroy();\n            if (success) success(model, resp, options);\n            if (!model.isNew()) model.trigger('sync', model, resp, options);\n        };\n\n        if (this.isNew()) {\n            options.success();\n            return false;\n        }\n        wrapError(this, options);\n\n        var sync = this.sync('delete', this, options);\n        options.xhr = sync;\n        if (!options.wait) destroy();\n        return sync;\n    },\n\n    // Proxy `ampersand-sync` by default -- but override this if you need\n    // custom syncing semantics for *this* particular model.\n    sync: function () {\n        return sync.apply(this, arguments);\n    },\n\n    // Default URL for the model's representation on the server -- if you're\n    // using Backbone's restful methods, override this to change the endpoint\n    // that will be called.\n    url: function () {\n        var base = result(this, 'urlRoot') || result(this.collection, 'url') || urlError();\n        if (this.isNew()) return base;\n        return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.getId());\n    }\n});\n\nmodule.exports = Model;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiM2JmYy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9hbXBlcnNhbmQtbW9kZWwvYW1wZXJzYW5kLW1vZGVsLmpzP2MxN2QiXSwic291cmNlc0NvbnRlbnQiOlsiLyokQU1QRVJTQU5EX1ZFUlNJT04qL1xudmFyIFN0YXRlID0gcmVxdWlyZSgnYW1wZXJzYW5kLXN0YXRlJyk7XG52YXIgc3luYyA9IHJlcXVpcmUoJ2FtcGVyc2FuZC1zeW5jJyk7XG52YXIgYXNzaWduID0gcmVxdWlyZSgnbG9kYXNoL2Fzc2lnbicpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoL2lzT2JqZWN0Jyk7XG52YXIgY2xvbmUgPSByZXF1aXJlKCdsb2Rhc2gvY2xvbmUnKTtcbnZhciByZXN1bHQgPSByZXF1aXJlKCdsb2Rhc2gvcmVzdWx0Jyk7XG5cbi8vIFRocm93IGFuIGVycm9yIHdoZW4gYSBVUkwgaXMgbmVlZGVkLCBhbmQgbm9uZSBpcyBzdXBwbGllZC5cbnZhciB1cmxFcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgXCJ1cmxcIiBwcm9wZXJ0eSBvciBmdW5jdGlvbiBtdXN0IGJlIHNwZWNpZmllZCcpO1xufTtcblxuLy8gV3JhcCBhbiBvcHRpb25hbCBlcnJvciBjYWxsYmFjayB3aXRoIGEgZmFsbGJhY2sgZXJyb3IgZXZlbnQuXG52YXIgd3JhcEVycm9yID0gZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIGVycm9yID0gb3B0aW9ucy5lcnJvcjtcbiAgICBvcHRpb25zLmVycm9yID0gZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgaWYgKGVycm9yKSBlcnJvcihtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIG1vZGVsLnRyaWdnZXIoJ2Vycm9yJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgIH07XG59O1xuXG52YXIgTW9kZWwgPSBTdGF0ZS5leHRlbmQoe1xuICAgIHNhdmU6IGZ1bmN0aW9uIChrZXksIHZhbCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgYXR0cnMsIG1ldGhvZDtcblxuICAgICAgICAvLyBIYW5kbGUgYm90aCBgXCJrZXlcIiwgdmFsdWVgIGFuZCBge2tleTogdmFsdWV9YCAtc3R5bGUgYXJndW1lbnRzLlxuICAgICAgICBpZiAoa2V5ID09IG51bGwgfHwgdHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucyA9IGFzc2lnbih7dmFsaWRhdGU6IHRydWV9LCBvcHRpb25zKTtcblxuICAgICAgICAvLyBJZiB3ZSdyZSBub3Qgd2FpdGluZyBhbmQgYXR0cmlidXRlcyBleGlzdCwgc2F2ZSBhY3RzIGFzXG4gICAgICAgIC8vIGBzZXQoYXR0cikuc2F2ZShudWxsLCBvcHRzKWAgd2l0aCB2YWxpZGF0aW9uLiBPdGhlcndpc2UsIGNoZWNrIGlmXG4gICAgICAgIC8vIHRoZSBtb2RlbCB3aWxsIGJlIHZhbGlkIHdoZW4gdGhlIGF0dHJpYnV0ZXMsIGlmIGFueSwgYXJlIHNldC5cbiAgICAgICAgaWYgKGF0dHJzICYmICFvcHRpb25zLndhaXQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zZXQoYXR0cnMsIG9wdGlvbnMpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlKGF0dHJzLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWZ0ZXIgYSBzdWNjZXNzZnVsIHNlcnZlci1zaWRlIHNhdmUsIHRoZSBjbGllbnQgaXMgKG9wdGlvbmFsbHkpXG4gICAgICAgIC8vIHVwZGF0ZWQgd2l0aCB0aGUgc2VydmVyLXNpZGUgc3RhdGUuXG4gICAgICAgIGlmIChvcHRpb25zLnBhcnNlID09PSB2b2lkIDApIG9wdGlvbnMucGFyc2UgPSB0cnVlO1xuICAgICAgICB2YXIgbW9kZWwgPSB0aGlzO1xuICAgICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIHZhciBzZXJ2ZXJBdHRycyA9IG1vZGVsLnBhcnNlKHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMud2FpdCkgc2VydmVyQXR0cnMgPSBhc3NpZ24oYXR0cnMgfHwge30sIHNlcnZlckF0dHJzKTtcbiAgICAgICAgICAgIGlmIChpc09iamVjdChzZXJ2ZXJBdHRycykgJiYgIW1vZGVsLnNldChzZXJ2ZXJBdHRycywgb3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBtb2RlbC50cmlnZ2VyKCdzeW5jJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB3cmFwRXJyb3IodGhpcywgb3B0aW9ucyk7XG5cbiAgICAgICAgbWV0aG9kID0gdGhpcy5pc05ldygpID8gJ2NyZWF0ZScgOiAob3B0aW9ucy5wYXRjaCA/ICdwYXRjaCcgOiAndXBkYXRlJyk7XG4gICAgICAgIGlmIChtZXRob2QgPT09ICdwYXRjaCcpIG9wdGlvbnMuYXR0cnMgPSBhdHRycztcbiAgICAgICAgLy8gaWYgd2UncmUgd2FpdGluZyB3ZSBoYXZlbid0IGFjdHVhbGx5IHNldCBvdXIgYXR0cmlidXRlcyB5ZXQgc29cbiAgICAgICAgLy8gd2UgbmVlZCB0byBkbyBtYWtlIHN1cmUgd2Ugc2VuZCByaWdodCBkYXRhXG4gICAgICAgIGlmIChvcHRpb25zLndhaXQgJiYgbWV0aG9kICE9PSAncGF0Y2gnKSBvcHRpb25zLmF0dHJzID0gYXNzaWduKG1vZGVsLnNlcmlhbGl6ZSgpLCBhdHRycyk7XG4gICAgICAgIHZhciBzeW5jID0gdGhpcy5zeW5jKG1ldGhvZCwgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gTWFrZSB0aGUgcmVxdWVzdCBhdmFpbGFibGUgb24gdGhlIG9wdGlvbnMgb2JqZWN0IHNvIGl0IGNhbiBiZSBhY2Nlc3NlZFxuICAgICAgICAvLyBmdXJ0aGVyIGRvd24gdGhlIGxpbmUgYnkgYHBhcnNlYCwgYXR0YWNoZWQgbGlzdGVuZXJzLCBldGNcbiAgICAgICAgLy8gU2FtZSB0aGluZyBpcyBkb25lIGJlbG93IGZvciBmZXRjaCBhbmQgZGVzdHJveVxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vQW1wZXJzYW5kSlMvYW1wZXJzYW5kLWNvbGxlY3Rpb24tcmVzdC1taXhpbi9jb21taXQvZDMyZDc4OGFhZmY5MTIzODdlYjExMDZmMmQ3YWQxODNlYzM5ZTExYSNkaWZmLTg0Yzg0NzAzMTY5YmY1MDE3YjFiYzMyMzY1M2FjYWEzUjMyXG4gICAgICAgIG9wdGlvbnMueGhyID0gc3luYztcbiAgICAgICAgcmV0dXJuIHN5bmM7XG4gICAgfSxcblxuICAgIC8vIEZldGNoIHRoZSBtb2RlbCBmcm9tIHRoZSBzZXJ2ZXIuIElmIHRoZSBzZXJ2ZXIncyByZXByZXNlbnRhdGlvbiBvZiB0aGVcbiAgICAvLyBtb2RlbCBkaWZmZXJzIGZyb20gaXRzIGN1cnJlbnQgYXR0cmlidXRlcywgdGhleSB3aWxsIGJlIG92ZXJyaWRkZW4sXG4gICAgLy8gdHJpZ2dlcmluZyBhIGBcImNoYW5nZVwiYCBldmVudC5cbiAgICBmZXRjaDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBjbG9uZShvcHRpb25zKSA6IHt9O1xuICAgICAgICBpZiAob3B0aW9ucy5wYXJzZSA9PT0gdm9pZCAwKSBvcHRpb25zLnBhcnNlID0gdHJ1ZTtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcztcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICBpZiAoIW1vZGVsLnNldChtb2RlbC5wYXJzZShyZXNwLCBvcHRpb25zKSwgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgICAgICAgIG1vZGVsLnRyaWdnZXIoJ3N5bmMnLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHN5bmMgPSB0aGlzLnN5bmMoJ3JlYWQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgb3B0aW9ucy54aHIgPSBzeW5jO1xuICAgICAgICByZXR1cm4gc3luYztcbiAgICB9LFxuXG4gICAgLy8gRGVzdHJveSB0aGlzIG1vZGVsIG9uIHRoZSBzZXJ2ZXIgaWYgaXQgd2FzIGFscmVhZHkgcGVyc2lzdGVkLlxuICAgIC8vIE9wdGltaXN0aWNhbGx5IHJlbW92ZXMgdGhlIG1vZGVsIGZyb20gaXRzIGNvbGxlY3Rpb24sIGlmIGl0IGhhcyBvbmUuXG4gICAgLy8gSWYgYHdhaXQ6IHRydWVgIGlzIHBhc3NlZCwgd2FpdHMgZm9yIHRoZSBzZXJ2ZXIgdG8gcmVzcG9uZCBiZWZvcmUgcmVtb3ZhbC5cbiAgICBkZXN0cm95OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyA/IGNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXM7XG4gICAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuXG4gICAgICAgIHZhciBkZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbW9kZWwudHJpZ2dlcignZGVzdHJveScsIG1vZGVsLCBtb2RlbC5jb2xsZWN0aW9uLCBvcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMud2FpdCB8fCBtb2RlbC5pc05ldygpKSBkZXN0cm95KCk7XG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIW1vZGVsLmlzTmV3KCkpIG1vZGVsLnRyaWdnZXIoJ3N5bmMnLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xuICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcEVycm9yKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciBzeW5jID0gdGhpcy5zeW5jKCdkZWxldGUnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgb3B0aW9ucy54aHIgPSBzeW5jO1xuICAgICAgICBpZiAoIW9wdGlvbnMud2FpdCkgZGVzdHJveSgpO1xuICAgICAgICByZXR1cm4gc3luYztcbiAgICB9LFxuXG4gICAgLy8gUHJveHkgYGFtcGVyc2FuZC1zeW5jYCBieSBkZWZhdWx0IC0tIGJ1dCBvdmVycmlkZSB0aGlzIGlmIHlvdSBuZWVkXG4gICAgLy8gY3VzdG9tIHN5bmNpbmcgc2VtYW50aWNzIGZvciAqdGhpcyogcGFydGljdWxhciBtb2RlbC5cbiAgICBzeW5jOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzeW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8vIERlZmF1bHQgVVJMIGZvciB0aGUgbW9kZWwncyByZXByZXNlbnRhdGlvbiBvbiB0aGUgc2VydmVyIC0tIGlmIHlvdSdyZVxuICAgIC8vIHVzaW5nIEJhY2tib25lJ3MgcmVzdGZ1bCBtZXRob2RzLCBvdmVycmlkZSB0aGlzIHRvIGNoYW5nZSB0aGUgZW5kcG9pbnRcbiAgICAvLyB0aGF0IHdpbGwgYmUgY2FsbGVkLlxuICAgIHVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYmFzZSA9IHJlc3VsdCh0aGlzLCAndXJsUm9vdCcpIHx8IHJlc3VsdCh0aGlzLmNvbGxlY3Rpb24sICd1cmwnKSB8fCB1cmxFcnJvcigpO1xuICAgICAgICBpZiAodGhpcy5pc05ldygpKSByZXR1cm4gYmFzZTtcbiAgICAgICAgcmV0dXJuIGJhc2UgKyAoYmFzZS5jaGFyQXQoYmFzZS5sZW5ndGggLSAxKSA9PT0gJy8nID8gJycgOiAnLycpICsgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuZ2V0SWQoKSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///3bfc\n")}}]);