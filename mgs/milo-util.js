//frame class
var advertFrame = function(data,index) {
  this.id = data.step;
  this.data = data;
  this.index = index;
  this.jq_obj = {};
  this.has_played = 0;
  this.render = function() {
    console.log('Rendering Frame ' + this.index)
    parseGroup(this.data,this.index);
    this.jq_obj = $('#ad #' + this.id);

    if(_.has(this.data, 'template_url')) {
      loadScreen(this.data.template_url, this.id);
    }

  };
  this.onLoad = function() {
    console.log('Playing Frame ' + this.index + ' - ' + this.id)
  };
  this.play = function() {
    if(this.jq_obj.hasClass('active')) {
      return
    }
    this.has_played = 1;
    TXM.api.setCurrentStep(this.index);
    $('#ad .step.active').trigger("onleave");
    $('#ad .step').removeClass('active')
    this.jq_obj.addClass('active');

    this.onLoad();
    this.jq_obj.trigger( "onplay" );
  };

  var parseGroup = function(layer, index) {

    //div element
    var step = $('<div id="'+ layer.step +'" class="step"/>');
    if(_.has(layer, 'styles')) {
      step.css(layer.styles)
    }
    step.css('zIndex', index);

    if(_.has(layer, 'attributes')) {
      _.each(layer.attributes, function(val, key) {
        step.attr(key,val);
      })
    }

    //div children
    //images
    if(_.has(layer, 'img_elements')) {
      var elements = layer.img_elements;
      for (var i = 0; i < elements.length; i++) {
        var el = addElement(elements[i], i, layer.step);
        step.append(el);
      }
    }

    //tags
    if(_.has(layer, 'elements')) {
      renderTags(step, layer);
    }

    $('#ad').append(step);
  };

  var addElement = function(el, index, id) {
    var attributes = parseElement(el);

    var div = $('<div id="'+ id + '-' + attributes.id +'" class="element"/>');
    div.css('zIndex', -index);

    var img = $('<img src="'+ attributes.src +'" id="'+ attributes.img_id +'" />');
    if(_.has(attributes, 'css')) {
      img.css(attributes.css)
    }
    if(_.has(attributes, 'attributes')) {
      _.each(attributes.attributes, function(val, key) {
        img.attr(key,val);
      })
    }
    if(_.has(attributes, 'class')) {
      div.addClass(attributes.class)
    }


    //div.css(attributes.css);
    div.append(img);

    renderTags(div, attributes);


    return div;
  };

  var parseElement = function(el) {
    var n = el.name.replace(' ', '_').split('.');

    parsed_obj =  {
      id: n[0],
      img_id: 'img-' + n[0],
      src: MILO.serviceUrl + 'assets/' + el.name, // remote
      css: {},
      attributes: {},
      class: 'element'
    };

    if(_.has(el, 'styles')) {
      parsed_obj.css = el.styles;
    }

    if(_.has(el, 'attributes')) {
      parsed_obj.attributes = el.attributes;
    }

    if(_.has(el, 'elements')) {
      parsed_obj.elements = el.elements;
    }

    if(_.has(el, 'class')) {
      parsed_obj.class = el.class;
    }

    return parsed_obj;
  };

  var renderTags = function(container_obj, tree) {

    if(_.has(tree, 'elements')) {
      _.each(tree.elements, function(element) {
        var tag = "div";
        var content = "&nbsp;";
        if(_.has(element, 'tag')) {
          tag = element.tag;
        }
        if(_.has(element, 'content')) {
          content = element.content;
        }

        var element_obj = $('<' + tag + ' />');
        element_obj.html(content)

        if(_.has(element, 'class')) {
          element_obj.addClass(element.class)
        }

        if(_.has(element, 'attributes')) {
          _.each(element.attributes, function(attr_obj) {
            _.each(attr_obj, function(el_attr, el_key) {
              element_obj.attr(el_key,el_attr)
            });
          });
        }

        renderTags(element_obj, element);

        container_obj.append(element_obj);
      })
    }


  };

  var loadScreen = function(template_path, id) {

    var context = {};
    jqxhr = $.ajax({
      type: "GET",
      url: MILO.serviceUrl + template_path,
      cache: false
    }).done(function(data) {
      source    = data;
      template  = Handlebars.compile(source)
      html = template(context)

      target = $('#ad #' + id)
      target.empty()
      target.html(html)

      target.find('.frame-link').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        MILO.playFrame($(this).attr('href'))
      })


    }).fail(function(data) {
      window.console.log("Request failed.");
      //window.console.log(data);
    });

  }


}

//video class
var advertVideo = (function(data) {
  this.id = data.id;
  this.data = data;
  this.thumb = data.thumb
  this.media = data.media
  this.video_obj = {}
  this.has_started = false

  // private constructor
   var __construct = function() {
      //console.log(data)
  }();

  this.render = function(container_obj,callback, endcallback, safaridonecallback, autoplay) {

    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

    $('#' + this.id).remove();

    var videoWrapper = $('<div id="' + this.id + '" class="video-player paused">');

    if (isSafari) {
      var img = $('<img src="'+ serviceUrl +'assets/' + this.thumb + '" class="video-safari-thumbnail">');
      videoWrapper.prepend(img);
    }

    var video_obj = $('<video id="surface_streaming" preload="preload" poster="'+serviceUrl+'assets/' + this.thumb + '" onClick=""/>');

    _.each(this.media, function(media_source_obj) {
      var source = $('<source src="'+ media_source_obj.url +'" type="'+ media_source_obj.type +'">');
      video_obj.append(source)
    })

    videoWrapper.append(video_obj);
    container_obj.append(videoWrapper);
    video_obj.load();

    this.video_obj = video_obj;

    var isTouch = ('ontouchstart' in document.documentElement);

    this.video_obj.addClass('capture-clicks');

    //if (!isTouch) {
      this.video_obj.on('click', function() {
          curr_video_obj = $(this).get(0)
          if(curr_video_obj.paused) {
            $(this).get(0).play();
          } else {
            $(this).get(0).pause();
          }
      });
    //}

    this.video_obj.get(0).addEventListener('play', this.onVideoStart.bind(this), false);
    this.video_obj.get(0).addEventListener('timeupdate', this.onVideoProgress.bind(this), false);
    this.video_obj.get(0).addEventListener('durationchange', this.toggleControls.bind(this), false);

    this.video_obj.bind('ended', function(event) {
      //console.log(event)
      var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
      if (isSafari) {
        $(this)[0].webkitExitFullscreen();
      }

      if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }

      TXM.api.track('multimedia', 'video_completed', event.target.currentSrc);
      // console.log('end: '+ TXM.creative._video.children('source').attr('src'));

      endcallback();
    });

    //done on mobile safari
    this.video_obj.bind('pause', function(event) {
      var userAgent = window.navigator.userAgent;
      var isMobileSafari = (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i));
      if (isMobileSafari) {
        if(!$(this).get(0).webkitDisplayingFullscreen) {
          safaridonecallback();
        }
      }

      $(this).parents('div').removeClass('paused').addClass('paused');

    });

    //done on mobile safari
    this.video_obj.bind('play', function(event) {
      $(this).parents('div').removeClass('paused');
      callback();
    });

    if(autoplay) {
      this.video_obj.bind('canplay', function(event) {
          $(this).get(0).play();
      });
    }

  }

  this.onVideoStart = function() {
    var self = this;

    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    if (isSafari) {
      $('#' + this.id).find('img').remove();
    }

    if(!this.has_started) {
      TXM.api.track('multimedia', 'video_started', this.video_obj.children('source').attr('src'));
      // console.log('start: '+ TXM.creative._video.children('source').attr('src'));

      this._firstQuartilePast = false;
      this._midpointPast = false;
      this._thirdQuartilePast = false;

    }

    this.has_started = true

  }

  this.onVideoProgress = function() {
    var progress = this.video_obj.get(0).currentTime / this.video_obj.get(0).duration;

    var src = this.video_obj.children('source').attr('src');

    if (!this._firstQuartilePast && progress >= 0.25) {
      this._firstQuartilePast = true;
      TXM.api.track('multimedia', 'video_first_quartile', src);
      // console.log('1: '+ src);
    } else if (!this._midpointPast && progress >= 0.50) {
      this._midpointPast = true;
      TXM.api.track('multimedia', 'video_second_quartile', src);
      // console.log('2: '+ src);
    } else if (!this._thirdQuartilePast && progress >= 0.75) {
      this._thirdQuartilePast = true;
      TXM.api.track('multimedia', 'video_third_quartile', src);
      // console.log('3: '+ src);
    }
  }


  this.hideControls = function() {
    this.video_obj.get(0).controls = false;
  }

  this.toggleControls = function() {
    this.video_obj.get(0).controls = true;
    setTimeout(this.hideControls.bind(this), 50);
  }

  this.play = function() {
    this.video_obj.bind('canplay', function(event) {
        $(this).get(0).play();
    });
  }


});

