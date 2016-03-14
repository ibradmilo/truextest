(function() {

  var creative = {
    _init: function() {
      TXM.dispatcher.addEventListenerOnce('ENGAGEMENT_STARTED', creative._onStart);
      TXM.dispatcher.addEventListenerOnce('ENGAGEMENT_ENDED', creative._onEnd);

      // preload assets
      //serviceUrl = "//stash.truex.com/milo/html-campaigns/trident/";
      serviceUrl = "//localhostest.com/truex/mgs/";
      $.when(
          $.getJSON( serviceUrl + 'engagement.json' ),
          $.getScript( serviceUrl + 'milo-util.js' ),
          $.getScript( serviceUrl + 'app.js' ),
          $.getScript( serviceUrl + 'underscore-min.js' ),
          $.getScript( serviceUrl + 'handlebars.js' ),
          $.getScript( serviceUrl + 'ion.sound.min.js' )
        ).done(function(config, milo, helpers, underscore, handlebars, audio){
          window.console.log('scripts imported');
          $('<link rel="stylesheet" href="' + serviceUrl + 'css/application.css">').appendTo('head');
          MILO.setConfig({
            data: config[0],
            serviceUrl : serviceUrl
          });

          MILO.preloadAssets();

          // when preload complete, signal ready to start
          TXM.dispatcher.dispatchEvent('INTERACTIVE_ASSET_READY');

          //TXM.dispatcher.dispatchEvent('ENGAGEMENT_STARTED');
      }).fail(function(error) {
          window.console.log(error);
        });

    },

    _onStart: function() {
      // start ad

      TXM.ui.show("<div id=\"ad\"></div>");
      //$('body').append("<div id=\"ad\"></div>");
      MILO.init();

    },

    _onEnd: function() {
      // end ad
    }
  };

  creative._init();
}());
