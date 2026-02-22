define(function () {
  'use strict';

  var p;

  var Utils = {
    getUID: function (modal) {
      var el = modal && modal.get && modal.get(0);
      if (!el || !el.id) {
        return null;
      }
      var match = el.id.match(/\d+/);
      return match ? match[0] : null;
    },

    getUsername: function (modal) {
      return modal.find('#chat-with-name').text();
    },

    getUserslug: function (modal) {
      return window.utils.slugify(Utils.getUsername(modal));
    },

    getEasyrtcid: function (modal) {
      return modal.data(p.config.dataKeys.easyrtcid);
    },

    getRoom: function (modal) {
      return modal.data(p.config.dataKeys.room);
    },

    checkConnection: function (modal, list) {
      if (modal.data(p.config.dataKeys.state) !== 'freeze') {
        if (Utils.hasConnection(modal, list)) {
          Utils.enableCalling(modal);
        } else {
          Utils.disableCalling(modal);
        }
      }
    },

    hasConnection: function (modal, list) {
      var clients = list;

      if (!clients) {
        var room = Utils.getRoom(modal);
        var roomData = (window.easyrtc && easyrtc.roomData) ? easyrtc.roomData[room] : null;
        if (roomData) {
          clients = roomData.clientList;
        }
      }

      if (!clients) {
        return false;
      }

      for (var c in clients) {
        if (Object.prototype.hasOwnProperty.call(clients, c)) {
          if (!window.easyrtc || c !== easyrtc.myEasyrtcid) {
            modal.data(p.config.dataKeys.easyrtcid, c);
            return true;
          }
        }
      }

      return false;
    },

    enableCalling: function (modal) {
      modal.find(p.config.selectors.button.call).removeAttr('disabled');
    },

    disableCalling: function (modal) {
      modal.find(p.config.selectors.button.call).attr('disabled', 'disabled');
    },

    freezeCalling: function (modal, disabled) {
      modal.data(p.config.dataKeys.state, 'freeze');
      if (disabled) {
        Utils.disableCalling(modal);
      }
    },

    unfreezeCalling: function (modal) {
      modal.data(p.config.dataKeys.state, 'allowed');
      Utils.ping();
    },

    modal: {
      toCalling: function (modal) {
        modal.find(p.config.selectors.container.endCallButton).show();
        modal.find(p.config.selectors.container.videoPanel).show();
        Utils.freezeCalling(modal, true);
      },

      toIncoming: function (modal) {
        modal.find(p.config.selectors.container.answerButtons).show();
        Utils.freezeCalling(modal, true);
      },

      toAnswered: function (modal) {
        modal.find(p.config.selectors.container.answerButtons).hide();
        modal.find(p.config.selectors.container.endCallButton).show();
        modal.find(p.config.selectors.container.videoPanel).show();
      },

      clean: function (modal) {
        modal.find(p.config.selectors.container.endCallButton).hide();
        modal.find(p.config.selectors.container.answerButtons).hide();
        modal.find(p.config.selectors.container.videoPanel).hide();
        Utils.unfreezeCalling(modal);
      },

      close: function (modal) {
        require(['chat'], function (chat) {
          chat.close(modal);
        });
      }
    },

    getConfig: function (callback) {
      var cb = (typeof callback === 'function') ? callback : function () {};

      if (!window.socket || typeof socket.emit !== 'function') {
        cb(new Error('socket is not available'));
        return;
      }

      socket.emit(p.config.sockets.getConfig, {}, function (err, config) {
        if (err) {
          cb(err);
          return;
        }

        p.config.vars = config || {};
        cb(null, p.config.vars);
      });
    },

    ping: function (callback) {
      setTimeout(function () {
        if (window.easyrtc && typeof easyrtc.updatePresence === 'function') {
          easyrtc.updatePresence('chat', 'ping');
        }
        if (typeof callback === 'function') {
          callback();
        }
      }, 1000);
    }
  };

  return function (Plugin) {
    Plugin.utils = Utils;
    p = Plugin;
  };
});
