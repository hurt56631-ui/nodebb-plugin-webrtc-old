define(function () {
  'use strict';

  var p;

  var Actions = {
    load: {
      register: function () {
        $('body')
          .off('focus.webrtc', '#chat-message-input')
          .on('focus.webrtc', '#chat-message-input', this.handle);
      },

      handle: function (e) {
        var modal = $(e.target).closest('.chat-modal');
        if (!modal.length) {
          return;
        }

        var isEquipped = modal.data(p.config.dataKeys.equiped);
        if (!isEquipped) {
          modal.data(p.config.dataKeys.equiped, true);
          p.base.prepareModal(modal);
        }
      }
    },

    close: {
      register: function (modal) {
        modal.find('#chat-close-btn')
          .off('click.webrtc')
          .on('click.webrtc', function () {
            Actions.close.handle(modal);
          });
      },

      handle: function (modal) {
        p.base.leaveRoom(modal);
      }
    },

    call: {
      register: function (modal) {
        modal.find(p.config.selectors.button.call)
          .off('click.webrtc')
          .on('click.webrtc', function () {
            Actions.call.handle(modal);
          });
      },

      handle: function (modal) {
        if (!window.easyrtc) {
          app.alertError('WebRTC is not available.');
          return;
        }

        var targetId = p.utils.getEasyrtcid(modal);
        if (!targetId) {
          app.alertError('The other user is not ready for a call yet.');
          return;
        }

        easyrtc.initMediaSource(function () {
          var me = modal.find(p.config.selectors.container.videoMe).get(0);
          if (me) {
            easyrtc.setVideoObjectSrc(me, easyrtc.getLocalStream());
          }

          p.utils.modal.toCalling(modal);

          easyrtc.call(
            targetId,
            function () {},
            function () {
              app.alertError('Something went wrong, please try again.');
              p.utils.modal.clean(modal);
            },
            function (accepted) {
              if (accepted) {
                p.utils.modal.toAnswered(modal);
              } else {
                p.utils.modal.clean(modal);
              }
            }
          );
        }, function () {
          app.alertError('There is an issue with your camera or microphone.');
        });
      }
    },

    endcall: {
      register: function (modal) {
        modal.find(p.config.selectors.button.endCall)
          .off('click.webrtc')
          .on('click.webrtc', function () {
            Actions.endcall.handle(modal);
          });
      },

      handle: function (modal) {
        if (window.easyrtc && typeof easyrtc.hangupAll === 'function') {
          easyrtc.hangupAll();
        }
        p.utils.modal.clean(modal);
      }
    }
  };

  return function (Plugin) {
    Plugin.actions = Actions;
    p = Plugin;
  };
});
