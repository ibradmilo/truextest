
// ENABLE UNIVERSAL LOG
window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments))}};

// ***********************
// SIMULATE REAL VARIABLES
// ***********************

// SET THE SERVICE URL TO BE THE SAME AS THIS PREVIEW PAGE
var loc = window.location.pathname;
var dir = loc.substring(0, loc.lastIndexOf('/'));
serviceUrl = "//"+window.location.host+dir+"/"; // USE THE SAME DOMAIN AS WHERE THIS PAGE IS LOADED

// SET MINIMUM REQUIRED AD_VARS FOR ENGAGEMENT TO RUN
var ad_vars = {
  "service_url":"//serve.truex.com",
  "media_bucket_name": window.location.host ,
  "creative_json":{
    "container_version":"2.0",
    "width":360,
    "height":540,
    "desktop":false,
    "tablet":false,
    "mobile":true,
    "asset_type":"interactive",
    "asset_url":"embed.js",
    "container_args":{},
  },
  "vote_summary_json":[],
  "recent_comments_json":[],
  "cachebuster_version":"1"
};
