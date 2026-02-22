define(function () {
  'use strict';

  var p = {
    vars: {
      rtc: null,
      initialized: false
    }
  };

  function done(callback, err, result) {
    if (typeof callback === 'function') {
      callback(err, result);
    }
  }

  function supportsWebRTC() {
    if (typeof window.easyrtc === 'undefined') {
      return false;
    }

    return (
      typeof easyrtc.supportsDataChannels === 'function' &&
      typeof easyrtc.supportsGetUserMedia === 'function' &&
      typeof easyrtc.supportsPeerConnections === 'function' &&
      easyrtc.supportsDataChannels() &&
      easyrtc.supportsGetUserMedia() &&
      easyrtc.supportsPeerConnections()
    );
  }

  return {
    init: function (callback) {
      if (p.vars.initialized) {
        done(callback, null, true);
        return;
      }

      require([
        '/plugins/nodebb-plugin-webrtc/static/js/lib/base.js',
        '/plugins/nodebb-plugin-webrtc/static/js/lib/utils.js',
        '/plugins/nodebb-plugin-webrtc/static/js/lib/actions.js',
        '/plugins/nodebb-plugin-webrtc/static/js/lib/events.js',
        '/plugins/nodebb-plugin-webrtc/static/js/lib/config.js'
      ], function (b, u, a, e, c) {
        try {
          b(p);
          u(p);
          a(p);
          e(p);
          c(p);
        } catch (err) {
          done(callback, err);
          return;
        }

        if (!supportsWebRTC()) {
          done(callback, null, false);
          return;
        }

        if (!p.utils || typeof p.utils.getConfig !== 'function') {
          done(callback, new Error('p.utils.getConfig is missing'));
          return;
        }

        p.utils.getConfig(function (err) {
          if (err) {
            done(callback, err);
            return;
          }

          if (p.config && p.config.vars && p.config.vars.running) {
            if (p.base && typeof p.base.init === 'function') {
              p.base.init();
            }
            p.vars.initialized = true;
            done(callback, null, true);
            return;
          }

          done(callback, null, false);
        });
      }, function (err) {
        done(callback, err || new Error('failed to load webrtc modules'));
      });
    },

    onRouteChange: function (data) {
      if (p.events && typeof p.events.onRouteChange === 'function') {
        p.events.onRouteChange(data);
      }
    }
  };
});
