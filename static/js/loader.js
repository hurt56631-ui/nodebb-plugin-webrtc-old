'use strict';

(function () {
  var mod = null;
  var initialized = false;

  function loadModule(callback) {
    if (mod) {
      callback();
      return;
    }

    require(['/plugins/nodebb-plugin-webrtc/static/js/lib/module.js'], function (loaded) {
      mod = loaded;
      callback();
    }, function (err) {
      console.error('[nodebb-plugin-webrtc] failed to load module.js', err);
    });
  }

  function initOnce() {
    if (initialized) {
      return;
    }

    loadModule(function () {
      if (!mod || typeof mod.init !== 'function') {
        console.error('[nodebb-plugin-webrtc] module.init() not found');
        return;
      }

      initialized = true;
      mod.init(function (err) {
        if (err) {
          console.error('[nodebb-plugin-webrtc] init failed', err);
        }
      });
    });
  }

  // NodeBB app bootstrap
  $(window).on('action:app.load', function () {
    initOnce();
  });

  // SPA route change (optional hook for module.js)
  $(window).on('action:ajaxify.end', function (ev, data) {
    if (mod && typeof mod.onRouteChange === 'function') {
      mod.onRouteChange(data);
    }
  });
}());
