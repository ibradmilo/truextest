if (typeof window.TXM === 'undefined') {
    window.TXM = {
        classes: {},
        utils: {}
    };
} else {
    window.TXM.classes = {};
    window.TXM.utils = {};
}
// keys shim
if(!Object.keys) {
    Object.keys = function(o){
        if (o !== Object(o)) { throw new TypeError('Object.keys called on non-object'); }
        var ret=[],p;
        for (p in o) {
            if (Object.prototype.hasOwnProperty.call(o,p)) { ret.push(p); }
        }
        return ret;
    };
}

Number.MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9999999;

// Array.filter polyfill (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisArg */) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") 
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
TXM.utils = {
    isSSL: function() {
        return (document.location.protocol == 'https:');
    },
    isQA: function() {
        return (document.location.hostname.indexOf('qa-') === 0);
    },
    isMraid: function() {
        return (typeof mraid != 'undefined');
    },
    isiOS: function() {
        return (navigator.userAgent.match(/(iPad|iPhone|iPod)/g));
    },
    isiOSPrivateMode: function() {
        var testKey = 'test', storage = window.sessionStorage;
        try {
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return false;
        } catch (error) {
            return true;
        }
    },
    isAndroid: function() {
        return (navigator.userAgent.match(/Android/ig));
    },
    isIE: function() {
        return (navigator.userAgent.match(/Trident/ig) || navigator.userAgent.match(/MSIE/ig));
    },
    isSafari: function() {
        return (navigator.userAgent.match(/safari/ig) && !TXM.utils.isChrome());
    },
    isChrome: function() {
        return (navigator.userAgent.match(/chrome/ig));
    },
    isFirefox: function() {
        return (navigator.userAgent.match(/firefox/ig));
    },
    trackGAPage: function(page) {
        page = page.replace(/\s/g, '_');
        page = "/" + page.toLowerCase();

        if (TXM.params.creative_id) {
            page = "/" + TXM.params.creative_id + page;
        }

        /* global _gaq: false */
        if (typeof _gaq != 'undefined') {
            _gaq.push(["_trackPageview", page]);
        }
    },
    trackEvent: function(category, name, value, onComplete) {
        var params = TXM.server.createParams('tracking_event');
        params['tracking_event[category]'] = category;
        params['tracking_event[name]'] = name;
        params['tracking_event[value]'] = (typeof value == 'undefined' || value === null ? '' : value);

        TXM.server.send(TXM.API_SERVER + '/tracking_events', 'post', params, onComplete);
    },
    trackGAEvent: function(category, action) {
        if (typeof _gaq != 'undefined') {
            _gaq.push(["_trackEvent", category, action, TXM.params.creative_id + '']);
        }
    },
    trackGAInitial: function() {
        //if (window.jsTiming) {
        //    jsTiming.trackTiming("Initial");
        //}
    },
    trackGATiming: function(category, name, time, label) {
        if (typeof _gaq != 'undefined') {
            _gaq.push(["_trackTiming", category, name, time, label]);
        }
    },
    timeSpent: function() {
        if (isNaN(TXM.params.start_time) || TXM.params.start_time === 0) {
            return 0;
        }

        if (TXM.api && TXM.api.true_attention) {
            if (TXM.api.true_attention.pause_time > 0) {
                return (TXM.api.true_attention.pause_time - TXM.params.start_time) - TXM.api.true_attention.time_away;
            }
            return ((new Date()).getTime() - TXM.params.start_time) - TXM.api.true_attention.time_away;
        }

        return ((new Date()).getTime() - TXM.params.start_time);
    },
    trackConsecutiveTT: function() {
        if (window.sessionStorage && !TXM.utils.isiOSPrivateMode()) {
            if (window.sessionStorage.ttQuestionCount) {
                if (window.sessionStorage.last_question_served_id != TXM.params.pending_true_targeting_requirements_json[0].id) {
                    window.sessionStorage.ttQuestionCount = Number(window.sessionStorage.ttQuestionCount) + 1;
                    TXM.utils.trackEvent('debug', 'consecutive_tt', Number(window.sessionStorage.ttQuestionCount));
                    window.sessionStorage.last_question_served_id = TXM.params.pending_true_targeting_requirements_json[0].id;
                }
            } else {
                window.sessionStorage.ttQuestionCount = 1;
                TXM.utils.trackEvent('debug', 'consecutive_tt', Number(window.sessionStorage.ttQuestionCount));
                window.sessionStorage.last_question_served_id = TXM.params.pending_true_targeting_requirements_json[0].id;
            }
        }
    },
    onClick: function(obj, clickNamespace, handler) {
        if ('ontouchstart' in document.documentElement) {
            obj.bind('touchstart.' + clickNamespace, handler);
        } else {
            obj.bind('click.' + clickNamespace, handler);
        }
    },
    replaceVars: function(str) {
        str = str.replace('[timestamp]', (new Date()).getTime());
        str = str.replace('[creative_id]', TXM.params.creative_id);
        str = str.replace('[campaign_id]', TXM.params.campaign_id);
        str = str.replace('[network_user_id]', TXM.params.network_user_id);
        str = str.replace('[session_id]', TXM.params.session_id);
        str = str.replace('[partner_config_hash]', TXM.params.placement_hash);
        str = str.replace('[placement_hash]', TXM.params.placement_hash);
        str = str.replace('[currency_amount]', (TXM.params.currency_amount === 0 ? 'your' : TXM.params.currency_amount));
        str = str.replace('[currency_label]', (TXM.params.currency_label_singular === 0 ? 'your' : TXM.params.currency_label_singular));
        return str;
    },
    onMessageReceived: function(e) {
        var data = e.data;

        if (!data) {
            return;
        }

        if (data == 'init_api_handshake') {
            e.source.postMessage('internal_message::' + JSON.stringify({
                id: 0,
                message: TXM.params
            }), "*");
        } else if ($.type(data) == 'string' && data.indexOf('internal_message::') === 0) {
            data = JSON.parse(data.substr(18));
        } else if (data != 'ack') {
            TXM.dispatcher.dispatchEvent('EXTERNAL_EVENT', data);
        }
    },
    scaleToFit: function() {
        if (TXM.params && TXM.params.preset_zoom) {
            document.body.style.zoom = TXM.params.preset_zoom;
            return;
        }

        var scaleFactor = document.documentElement.clientWidth / 360;
        document.body.style.zoom = scaleFactor;
    },
    addCachebusterToURL: function(url) {
        function hasURLParams(url) {
            if (url.indexOf("?") == -1) {
                return false;
            } else {
                return true;
            }
        }

        if (hasURLParams(url)) {
            return url + "&cb=" + TXM.params.cachebuster_version;
        } else {
            return url + "?cb=" + TXM.params.cachebuster_version;
        }
    }
};
(function(){
    var logger = {};

    logger.suppressedCategories = {};
    
    logger.log = function(str, category) {
        if (!logger.suppressedCategories[category]) {
            var prefix = category ? "TXM." + category + ": " : "TXM: ";
            try {
                 console.log(prefix + str);                
             } catch (e) {}
        }
    };

    TXM.logger = logger;
    TXM.log = TXM.logger.log;
})();

(function() {
    var LoadingPhase = function(name, externalLoader) {
        this.phaseName = name;
        this.queue = [];
        this.completedLoads = 0;

        this.externalLoader = typeof(externalLoader) == 'undefined' ? false : externalLoader;
        this.externalProgress = 0;
        this.externalItems = 0;
    };

    var p = LoadingPhase.prototype;

    p.loadScripts = function(onComplete) {
        TXM.log('"' + this.phaseName + '" loading phase started', 'loader');

        if (this.queue.length === 0) {
            TXM.log('"' + this.phaseName + '" phase complete', 'loader');
            onComplete();
            return;
        }

        var that = this;

        var onScriptLoad = function() {
            that.completedLoads += 1;

            TXM.dispatcher.dispatchEvent("LOADER_PROGRESS");

            if (that.isPhaseComplete()) {
                TXM.log('"' + that.phaseName + '" phase complete', 'loader');
                onComplete();
            }
        };

        for (var i = 0; i < this.queue.length; i++) {
            var scriptData = this.queue[i];
            this.createScriptTag(scriptData, onScriptLoad);
        }
    };

    p.addScript = function(url, callback) {
        var scriptInfo = {
            done: false,
            url: TXM.utils.addCachebusterToURL(url),
            callback: callback
        };

        this.queue.push(scriptInfo);
    };

    p.onExternalItemLoaded = function() {
        this.externalProgress += (1.0 / this.externalItems);
        TXM.dispatcher.dispatchEvent("LOADER_PROGRESS");
    };

    p.setProgress = function(percent) {
        this.externalProgress = percent;
        TXM.dispatcher.dispatchEvent("LOADER_PROGRESS");
    };

    p.getProgress = function() {
        if (this.externalLoader) {
            return this.externalProgress;
        }

        var totalLoads = this.queue.length * 1.0;

        if (totalLoads > 0) {
            return this.completedLoads / totalLoads - 0.15; // 0.15 decrease for better progress visualization
        } else {
            return 0;
        }

    };

    p.createScriptTag = function(scriptInfo, onScriptLoad) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = scriptInfo.url;

        script.onload = script.onreadystatechange = function() {
            if (!scriptInfo.done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                TXM.log(scriptInfo.url + ' loaded', 'loader');

                script.onload = script.onreadystatechange = null;
                scriptInfo.done = true;

                onScriptLoad();

                if (typeof scriptInfo.callback == 'function') {
                    scriptInfo.callback();
                }
            }
        };

        document.querySelectorAll('head')[0].appendChild(script);
    };

    p.isPhaseComplete = function() {
        if (this.externalLoader) {
            return (this.externalProgress >= 1);
        }

        return this.completedLoads == this.queue.length;
    };

    TXM.classes.LoadingPhase = LoadingPhase;
})();
TXM.xdm = {
    ready: false,
    target: window.opener || window.parent,
    postMessage: function(message, payload) {
        if (!TXM.xdm.ready) {
            TXM.dispatcher.addEventListenerOnce('XDM_READY', function() {
                TXM.xdm.postMessage(message, payload);
            });
            return;
        }

        var wrapper = {
            'message': message,
            'payload': payload
        };

        if (TXM.params.svfc_channel) {
            var serializedMessage = JSON.stringify(wrapper);
            TXM.xdm.swf.sendMessage(TXM.params.svfc_channel, serializedMessage);
        }

        if (TXM.params.truexdm_channel && TXM.xdm.target && TXM.xdm.target != window) {
            wrapper.channelName = TXM.params.truexdm_channel;

            TXM.xdm.target.postMessage(wrapper, '*');
        }
    },
    activityStart: function() {
        TXM.xdm.postMessage('start');
    },
    activityCredit: function(engagement) {
        TXM.xdm.postMessage('credit', engagement);
    },
    activityPartialCredit: function(engagement) {
        TXM.xdm.postMessage('partialCredit', engagement);
    },
    activityFinish: function() {
        TXM.xdm.postMessage('finish');
    },
    activityError: function() {
        TXM.xdm.postMessage('error');
    },
    activityClosed: function() {
        TXM.xdm.postMessage('close');
    }
};
TXM.dispatcher = {
    _listeners: {},
    addEventListener: function(event, listener, priority, fireOnce) {
        var name = event.split('.')[0];
        var namespace = (event.split('.')[1] || '');
        var listeners = (TXM.dispatcher._listeners[name] || []);
        if (typeof priority == 'undefined') {
            priority = 0;
        }

        var data = {
            namespace: namespace,
            listener: listener,
            priority: priority,
            fireOnce: typeof(fireOnce) == 'undefined' ? false : fireOnce
        };

        var added = false;
        for (var i = 0; i < listeners.length; i++) {
            if (priority > listeners[i].priority) {
                listeners.splice(i, 0, data);
                added = true;
                break;
            }
        }

        if (!added) {
            listeners.push(data);
        }

        TXM.dispatcher._listeners[name] = listeners;
    },
    addEventListenerOnce: function(event, listener, priority) {
        TXM.dispatcher.addEventListener(event, listener, priority, true);
    },
    removeEventListener: function(event, listener) {
        var name = event.split('.')[0];
        var namespace = (event.split('.')[1] || '');
        var listeners = TXM.dispatcher._listeners[name];

        if (listeners instanceof Array) {
            if (!namespace && typeof listener == 'undefined') {
                delete TXM.dispatcher._listeners[name];
            } else {
                for (var i = 0; i < listeners.length; i++) {
                    if (namespace == listeners[i].namespace) {
                        if (typeof listener == 'undefined') {
                            listeners.splice(i--, 1);
                        } else if (listener === listeners[i].listener) {
                            listeners.splice(i--, 1);
                        }
                    }
                }
            }
        }
    },
    dispatchEvent: function(event, data) {
        var name = event.split('.')[0];
        var namespace = event.split('.')[1];
        var listeners = TXM.dispatcher._listeners[name];

        if (listeners instanceof Array) {
            var stopPropagationRequested = false;

            var payload = {
                stopPropagation: function() {
                    stopPropagationRequested = true;
                },
                data: data
            };

            for (var i = 0; i < listeners.length; i++) {
                if (stopPropagationRequested) {
                    break;
                }

                listeners[i].fired = true;

                try {
                    if (!namespace) {
                        listeners[i].listener(payload);
                    } else if (namespace == listeners[i].namespace || !listeners[i].namespace) {
                        listeners[i].listener(payload);
                    }
                } catch (e) {
                    if (_is.debug) {
                        console.error("Error from %s.%s: %s", event, listeners[i].namespace, e.message);
                    } else {
                        TXM.log('Error in event listener: ' + e.toString());
                    }
                    TXM.utils.trackGAEvent('error', e.message);
                }
            }

            TXM.dispatcher._listeners[name] = listeners.filter(function(val, i, arr) {
                return !listeners[i].fireOnce || !listeners[i].fired;
            });
        }
    }
};
TXM.dispatcher.on = TXM.dispatcher.addEventListener;
TXM.dispatcher.off = TXM.dispatcher.removeEventListener;
TXM.dispatcher.one = TXM.dispatcher.addEventListenerOnce;
TXM.dispatcher.trigger = TXM.dispatcher.dispatchEvent;
/* global ad_vars:true */

var _is = {
    simulated: true,
    debug: true,
    ee_debug: false,
    qa: false,
    error: false,
    desktop: true,
    mobile: false,
    pending_true_targeting_requirement: false,
    background_mode: false
};

TXM.loader = {
    init: function() {
        TXM.loader.progressBar = document.querySelectorAll('.progress')[0];

        TXM.loader._parseParams(TXM.loader.loadContainer);
    },

    loadContainer: function() {
        var containerPhase = TXM.loader.containerPhase = new TXM.classes.LoadingPhase('container');
        var interactiveAssetPhase = TXM.loader.interactiveAssetPhase = new TXM.classes.LoadingPhase('interactive_asset', true);
        var engagementAssetsPhase = TXM.loader.engagementAssetsPhase = new TXM.classes.LoadingPhase('engagement_assets', true);

        var containerDirectory = TXM.params.protocol + '//media.truex.com' + '/container/' + TXM.params.container_version + '/';
        var extensionsDirectory = containerDirectory + 'extensions/';

        // load jquery
        containerPhase.addScript(TXM.params.protocol + '//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', TXM.loader.onJqueryLoaded);

        if (TXM.params.svfc_channel) {
            containerPhase.addScript(containerDirectory + 'svfc.js');
        } else {
            TXM.xdm.ready = true;
        }

        // load container module
        if (_is.error) {
            containerPhase.addScript(containerDirectory + 'error.js');
        } else if (_is.pending_true_targeting_requirement) {
            containerPhase.addScript(containerDirectory + 'true_targeting.js');
        } else if (_is.background_mode) {
            TXM.loader._addBdiv();
            TXM.loader._disableGATracking();
            containerPhase.addScript(containerDirectory + 'background.js');
        } else if (_is.mobile) {
            TXM.loader._setupLoadTimeout();
            containerPhase.addScript(extensionsDirectory + 'legacy.js');
            containerPhase.addScript(containerDirectory + 'mobile.js');
        } else {
            TXM.loader._addBdiv();
            TXM.loader._setupLoadTimeout();

            var loadingCopy = TXM.params.loading_copy;
            if (!loadingCopy) {
                loadingCopy = "Interact with<br>" + (TXM.params.connection_brand_name || 'this ad');

                if (TXM.params.currency_label_singular) {
                    loadingCopy += "<br>to earn your " + TXM.params.currency_label_singular;
                }
            }

            document.querySelectorAll('.copy')[0].innerHTML = loadingCopy;
            containerPhase.addScript(containerDirectory + 'desktop.js');
        }


        // load extensions if required
        if (_is.debug) {
            containerPhase.addScript(extensionsDirectory + 'debugger.js');
        }

        if (_is.ee_debug) {
            containerPhase.addScript(extensionsDirectory + 'ee_debugger.js');
        }

        if (_is.simulated) {
            containerPhase.addScript(extensionsDirectory + 'simulator.js');
        }

        if (_is.engagement_hd) {
            var loading = document.querySelectorAll('.loading')[0];
            if (loading) {
                document.body.style.width = TXM.params.engagement_width + 'px';
                loading.className = 'loading-hd';
                loading.innerHTML = '<div class="loading-text">Loading your experience...</div><div class="pie"><span class="first"></span><span class="second"></span></div>';
            }
            containerPhase.addScript(extensionsDirectory + 'engagement_hd.js');

            TXM.params.frame_top_height = 40;
        }

        if (TXM.params.custom_extensions) {
            for (var i = 0; i < TXM.params.custom_extensions.length; i++) {
                containerPhase.addScript(TXM.params.custom_extensions[i]);
            }
        }

        TXM.dispatcher.addEventListener("LOADER_PROGRESS", TXM.loader._onLoaderProgress);

        containerPhase.loadScripts(function() {
            TXM.loader._initializeExtensions();
            TXM.container.init();
        });
    },


    /***************
       Extensions
    ****************/
    _extensions: [],

    registerExtension: function(name, init, priority) {
        var data = {
            name: name,
            init: init,
            initialized: false,
            priority: (priority || 0)
        };

        var added = false;
        for (var i = 0; i < TXM.loader._extensions.length; i++) {
            if (priority > TXM.loader._extensions[i].priority) {
                TXM.loader._extensions.splice(i, 0, data);
                added = true;
                break;
            }
        }

        if (!added) {
            TXM.loader._extensions.push(data);
        }
    },

    _initializeExtensions: function() {
        TXM.dispatcher.addEventListener('EXTENSION_INITIALIZED', TXM.loader._onExtensionInitialized);
        for (var i = 0; i < TXM.loader._extensions.length; i++) {
            if (TXM.loader._extensions[i].init) {
                TXM.loader._extensions[i].init();
            }
        }
    },

    _onExtensionInitialized: function(e) {
        for (var i = 0; i < TXM.loader._extensions.length; i++) {
            if (e.data == TXM.loader._extensions[i].name) {
                TXM.log(e.data + ' extension initialized', 'loader');
                TXM.loader._extensions[i].initialized = true;
            }
        }

        for (var j = 0; j < TXM.loader._extensions.length; j++) {
            if (!TXM.loader._extensions[j].initialized) {
                return;
            }
        }

        TXM.log('All extensions initialized!', 'loader');
    },


    /********************
       Loading Progress
    *********************/
    _onLoaderProgress: function() {
        var percent = TXM.loader.getProgress();
        if (TXM.loader.progressBar) {
            TXM.loader.progressBar.style.width = (percent * 100).toString() + '%';
        }
        if (TXM.engagement_hd && TXM.loader.jqueryLoaded) {
            TXM.engagement_hd.updateProgressWithPercent(percent, '.loading-hd');
        }
    },


    getProgress: function() {
        var phases = [TXM.loader.containerPhase, TXM.loader.interactiveAssetPhase, TXM.loader.engagementAssetsPhase];
        var progress = 0;

        for (var i = 0; i < phases.length; i++) {
            progress += phases[i].getProgress() * 1.0 / phases.length;
        }

        return progress;
    },

    jqueryLoaded: false,
    onJqueryLoaded: function() {
        if (!TXM.params.simulated) {
            // error checking //
            TXM.dispatcher.addEventListener("SERVICE_ERROR", function(e) {
                TXM.utils.trackGAEvent('error', e.data.type + ': ' + e.data.service + ' - ' + e.data.message);
            });
        }

        $(document).ajaxError(function( e, jqxhr, settings, exception ) {
            if ( settings.dataType == "script" ) {
                TXM.utils.trackGAEvent('error', "script load fail: " + settings.url);
            }
        });

        TXM.loader.jqueryLoaded = true;
    },


    /********************
       Params
    *********************/
    _parseParams: function(onComplete) {
        TXM.params = {'protocol':'', 'media_bucket_name':'media.truex.com', 'container_version':'2.0'};

        if (!ad_vars) {
            _is.error = true;
            TXM.params.error_message = "There was a problem loading your ad";
            onComplete();
            return;
        }

        TXM.params = ad_vars;
        TXM.params.current_step = 0;
        TXM.params.protocol = location.protocol == 'https:' ? 'https:' : 'http:';

        TXM.API_SERVER = TXM.params.protocol + TXM.params.service_url;

        // determine type of engagement //
        if (TXM.params.error_message) {
            _is.error = true;
        }

        if (TXM.params.simulated === false) {
            _is.simulated = false;
        }

        if (TXM.params.service_url.indexOf('qa-') != -1) {
            _is.qa = true;
        }

        if (TXM.params.creative_json.mobile) {
            _is.mobile = true;
            TXM.params.mobile = true;
        } else if (TXM.params.creative_json.desktop) {
            _is.desktop = true;
            TXM.params.desktop = true;
        }

        if (TXM.params.pending_true_targeting_requirements_json && TXM.params.pending_true_targeting_requirements_json.length > 0) {
            TXM.params.pending_true_targeting_requirements = true;
            _is.pending_true_targeting_requirement = true;
        }

        TXM.params.custom_extensions = [];

        var extra_vars = TXM.params.extra_parameters_json;
        for (var var_name in extra_vars) {
            if (extra_vars[var_name] === 'true' || extra_vars[var_name] === 'false') {
                TXM.params[var_name] = (extra_vars[var_name] === 'true');
            } else {
                TXM.params[var_name] = extra_vars[var_name];
            }
        }

        _is.debug = TXM.params.debug;
        _is.ee_debug = TXM.params.ee_debug;
        _is.background_mode = TXM.params.background_mode;
        _is.engagement_hd = (TXM.params.engagement_hd && !_is.background_mode);
        
        if (TXM.params.preview && !_is.preview) {
            // setup preview bridge //
            _is.preview = true;
            window.addEventListener("message", function(e) {
                if (e.data.ad_vars) {
                    console.log('studio response: %O', e.data);
                    window.ad_vars = e.data.ad_vars;
                    TXM.loader._parseParams(onComplete);
                }
            });
            window.parent.postMessage({"ad_vars_request":true, "ad_vars":ad_vars}, "*");
            return;
        }

        if (TXM.params.placement_json) {
            TXM.params.chrome_url = TXM.params.placement_json.module_url;
            TXM.params.currency_label_singular = TXM.params.placement_json.currency_label;
            if (TXM.params.placement_json.module_args) {
                var placement_module_vars = TXM.params.placement_json.module_args.split('@');

                for (var j = 0; j < placement_module_vars.length; j++) {
                    var pName = placement_module_vars[j].split('=', 2)[0];
                    var pValue = placement_module_vars[j].split('=', 2)[1];

                    TXM.params[pName] = TXM.utils.replaceVars(decodeURIComponent(pValue));
                }
            }

            if (TXM.params.chrome_url && TXM.params.chrome_url.indexOf('.swf') == -1) { // temp fix for old config swfs
                TXM.params.custom_extensions.push(TXM.params.chrome_url);
            }
        }

        var container_args = TXM.params.creative_json.container_args;
        for (var key in container_args) {
            TXM.params[key] = container_args[key];
        }

        if (TXM.params.creative_json) {
            TXM.params.asset_url = TXM.params.asset_url || TXM.params.creative_json.asset_url;

            if (TXM.params.creative_json.name) {
                TXM.params.activity_name = TXM.params.creative_json.name;
            }

            if (TXM.params.creative_json.container_version) {
                TXM.params.container_version = TXM.params.creative_json.container_version;
            }

            if (TXM.params.creative_json.asset_args) {
                TXM.params.builder_json = JSON.stringify(TXM.params.creative_json.asset_args);
            }

            TXM.params.engagement_width = parseInt(TXM.params.creative_json.width, 10);
            TXM.params.engagement_height = parseInt(TXM.params.creative_json.height, 10);
        }

        TXM.params.times_started = parseInt(TXM.params.initials || 0, 10);
        TXM.params.partner_config_hash = TXM.params.placement_hash;
        TXM.params.currency_amount = parseInt(TXM.params.currency_amount || 0, 10);

        if (TXM.params.placement_json) {
            TXM.params.placement_id = TXM.params.placement_json.id;
            TXM.params.partner_id = TXM.params.placement_json.partner_id;
            TXM.params.placement_name = TXM.params.placement_json.name;
            TXM.params.currency_label_plural = TXM.params.placement_json.currency_label_plural;
        }

        // default for now
        TXM.params.advertiser_billing_type = 'completed';

        if (TXM.params.campaign_json) {
            TXM.params.campaign_id = TXM.params.campaign_json.id;
            TXM.params.advertiser_billing_type = TXM.params.campaign_json.io_unit_type;
            TXM.params.comment_engagement_datas = TXM.params.recent_comments_json;
            TXM.params.vote_engagement_datas = TXM.params.vote_summary_json;
        } else if (TXM.params.test_campaign_id) {
            TXM.params.campaign_id = TXM.params.test_campaign_id;
        }

        if (TXM.params.location_json) {
            TXM.params.country_code = TXM.params.location_json.country_code || 'US';
            TXM.params.region = TXM.params.location_json.region || 'CA';
            TXM.params.zipcode = TXM.params.location_json.postal_code;
        }

        if (TXM.params.module_vars) {
            var module_vars = TXM.params.module_vars.split('@');

            for (var i = 0; i < module_vars.length; i++) {
                var name = module_vars[i].split('=', 2)[0];
                var value = module_vars[i].split('=', 2)[1];

                TXM.params[name] = TXM.utils.replaceVars(decodeURIComponent(value));
            }
        }

        if (TXM.params.settings) {
            var settings = TXM.params.settings;
            for (var setting in settings) {
                TXM.params[setting] = settings[setting];
            }
        }

        for (var param_name in TXM.params) {
            if (param_name.indexOf('_custom_extension') != -1) {
                TXM.params.custom_extensions.push(TXM.params[param_name]);
            }
        }

        onComplete();
    },

    /********************
       ADBTracking
    *********************/
    _addBdiv: function() {
        var bdiv = document.createElement('div');
        bdiv.className = 'ad-div';
        bdiv.style.position = 'absolute';
        bdiv.style.height = '1px';
        bdiv.style.width = '1px';
        document.body.appendChild(bdiv);

        TXM.params.bdiv_added = true;
    },

    /********************
       Load Timeout
    *********************/
    _setupLoadTimeout: function() {
        TXM.params.load_start_time = (new Date()).getTime();
        setTimeout(TXM.loader._onLoadTimeout, 10000);
    },

    _onLoadTimeout: function() {
        if (!TXM.loader.containerPhase.isPhaseComplete()) {
            TXM.utils.trackEvent('debug', 'load_timeout_10sec', 'container');
        } else if (!TXM.loader.interactiveAssetPhase.isPhaseComplete()) {
            TXM.utils.trackEvent('debug', 'load_timeout_10sec', 'interactive_asset');
        } else if (!TXM.loader.engagementAssetsPhase.isPhaseComplete()) {
            TXM.utils.trackEvent('debug', 'load_timeout_10sec', 'engagement_assets');
        }
    },

    /********************
       Utils
    *********************/
    _disableGATracking: function() {
        var noop = function() {};

        TXM.utils.trackGAEvent = noop;
        TXM.utils.trackGAInitial = noop;
        TXM.utils.trackGAPage = noop;
        TXM.utils.trackGATiming = noop;
    }
};

TXM.loader.init();
TXM.server = {
    send: function(service, method, params, callback, error) {
        var data = ['_method=' + method];
        data.push("format=json");

        if ($.isArray(params)) {
            $.merge(data, params);
        } else {
            for (var name in params) {
                data.push(name + "=" + encodeURIComponent(params[name]));
            }
        }

        $.ajax({
            "type": method,
            "async": true,
            "url": service,
            "data": data.join('&'),
            "success": function(resp) {
                if (callback) {
                    callback(resp);
                }
                TXM.dispatcher.dispatchEvent('SERVICE_SENT', {
                    service: service,
                    params: params
                });
            },
            "error": function(xhr, textStatus, errorThrown) {
                if (error) {
                    error();
                }
                TXM.dispatcher.dispatchEvent('SERVICE_ERROR', {
                    service: service,
                    params: params,
                    type: errorThrown,
                    message: (xhr ? xhr.responseText : '')
                });
            }
        });
    },
    createParams: function(serviceName) {
        var params = {};
        var addParam = function(label, value) {
            if (typeof value !== 'undefined' && value !== null) {
                params[serviceName + '[' + label + ']'] = value;
            }
        };
        addParam('placement_hash', TXM.params.placement_hash);
        addParam('network_user_id', TXM.params.network_user_id);
        addParam('impression_signature', TXM.params.impression_signature);
        addParam('impression_timestamp', TXM.params.impression_timestamp);
        addParam('currency_amount', TXM.params.currency_amount);
        addParam('session_id', TXM.params.session_id);
        addParam('bid_info', TXM.params.bid_info);
        addParam('campaign_id', TXM.params.campaign_id);
        addParam('referring_source', TXM.params.referring_source);
        addParam('stream_id', TXM.params.stream_id);
        addParam('demographic_data_source', TXM.params.demographic_data_source);

        return params;
    },
    saveEngageData: function(data, onComplete) {
        if (!TXM.params.engagement_message_id) {
            TXM.dispatcher.addEventListenerOnce('ENGAGEMENT_CREDITED', function() {
                TXM.server.saveEngageData(data, onComplete);
            });
            return;
        }

        var params = {};
        for (var name in data) {
            params['engagement_data[' + name + ']'] = data[name];
        }

        params['engagement_data[engagement_message_id]'] = TXM.params.engagement_message_id;

        if (TXM.params.session_id) {
            params['engagement_data[session_id]'] = TXM.params.session_id;
        }

        TXM.server.send(TXM.API_SERVER + '/engagements/create_data', 'post', params, onComplete);
    },
    updateUser: function(data, onComplete) {
        var param_arr = [
            'user[placement_hash]=' + TXM.params.placement_hash,
            'user[network_user_id]=' + TXM.params.network_user_id
        ];

        if (data.gender) {
            param_arr.push('user[gender]=' + data.gender);
        }

        if (data.born_on) {
            param_arr.push('user[born_on]=' + data.born_on.toString());
        }

        if (data.age_range_lower) {
            param_arr.push('user[age_range_lower]=' + data.age_range_lower);
        }

        if (data.age_range_upper) {
            param_arr.push('user[age_range_upper]=' + data.age_range_upper);
        }

        if (data.custom_answers) {
            for (var i = 0; i < data.custom_answers.length; i++) {
                param_arr.push(decodeURIComponent($.param({
                    'user[true_targeting_answers][]': data.custom_answers[i]
                })));
            }
        }

        TXM.server.send(TXM.API_SERVER + '/users', 'put', param_arr, onComplete);
    }
};