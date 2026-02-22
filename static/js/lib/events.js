define(function () {
  'use strict';

  var p;

  var Events = {
    oncall: {
      register: function (modal) {
        easyrtc.setAcceptChecker(function (callerId, cb) {
          Events.oncall.handleAccept(modal, callerId, cb);
        });

        easyrtc.setStreamAcceptor(function (callerEasyrtcid, stream) {
          Events.oncall.handle(modal, stream);
        });

        easyrtc.setCallCancelled(function () {
          p.utils.modal.clean(modal);
        });
      },

      handle: function (modal, stream) {
        p.utils.modal.toAnswered(modal);
        var them = modal.find(p.config.selectors.container.videoThem).get(0);
        if (them) {
          easyrtc.setVideoObjectSrc(them, stream);
        }
      },

      handleAccept: function (modal, callerId, cb) {
        p.utils.modal.toIncoming(modal);

        var acceptor = function (isAccepted) {
          if (!isAccepted) {
            p.utils.modal.clean(modal);
            cb(false);
            return;
          }

          easyrtc.initMediaSource(function () {
            var me = modal.find(p.config.selectors.container.videoMe).get(0);
            if (me) {
              easyrtc.setVideoObjectSrc(me, easyrtc.getLocalStream());
            }
            cb(true);
          }, function () {
            app.alertError('There is an issue with your camera or microphone.');
            cb(false);
          });
        };

        modal.find(p.config.selectors.button.answer)
          .off('click.webrtc')
          .on('click.webrtc', function () {
            acceptor(true);
          });

        modal.find(p.config.selectors.button.decline)
          .off('click.webrtc')
          .on('click.webrtc', function () {
            acceptor(false);
          });
      }
    },

    onpresence: {
      register: function (modal) {
        easyrtc.setRoomOccupantListener(function (roomName, list) {
          Events.onpresence.handle(roomName, list, modal);
        });
        p.utils.checkConnection(modal);
      },

      handle: function (roomName, list, modal) {
        if (roomName === modal.data(p.config.dataKeys.room)) {
          p.utils.checkConnection(modal, list);
        }
      }
    },

    onstreamclosed: {
      register: function (modal) {
        easyrtc.setOnStreamClosed(function (easyrtcid) {
          Events.onstreamclosed.handle(modal, easyrtcid);
        });
      },

      handle: function (modal, easyrtcid) {
        p.utils.modal.clean(modal);
        var them = modal.find(p.config.selectors.container.videoThem).get(0);
        if (them) {
          easyrtc.setVideoObjectSrc(them, '');
        }
      }
    },

    ondisconnect: {
      register: function (modal) {
        easyrtc.setDisconnectListener(function () {
          Events.ondisconnect.handle(modal);
        });
      },

      handle: function () {
        app.alertError('You seem to have lost connection with the server.');
      }
    },

    onerror: {
      register: function (modal) {
        easyrtc.setOnError(this.handle);
      },

      handle: function (errObj) {
        var message = (errObj && errObj.errorText) ? errObj.errorText : 'Unknown error';
        app.alertError('An error occurred: ' + message);
      }
    }
  };

  return function (Plugin) {
    Plugin.events = Events;
    p = Plugin;
  };
});
