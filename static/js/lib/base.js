define(function () {
  'use strict';

  var p;

  var Base = {
    vars: {
      connected: false
    },

    init: function () {
      if (!window.easyrtc) {
        app.alertError('WebRTC library failed to load.');
        return;
      }

      if (Base.vars.connected) {
        p.actions.load.register();
        return;
      }

      var username = (app.user && app.user.username) || app.username || ('uid-' + app.uid);
      easyrtc.setUsername(window.utils.slugify(username));

      easyrtc.connect(
        p.config.appName,
        function () {
          Base.vars.connected = true;
          p.actions.load.register();
        },
        function (errID, errText) {
          app.alertError('Something went wrong while connecting to the server...');
          console.error('[nodebb-plugin-webrtc] connect error', errID, errText);
        }
      );
    },

    prepareModal: function (modal) {
      if (!modal || !modal.length) {
        return;
      }

      // Avoid injecting duplicate controls if this modal has already been prepared.
      if (modal.find(p.config.selectors.button.call).length) {
        Base.connectToRoom(modal);
        return;
      }

      var html = {
        buttons: {
          call: '<button type="button" class="btn btn-success" id="webrtc-call-btn" disabled>Call</button>',
          answer: '<button type="button" class="btn btn-success" id="webrtc-answer-btn">Answer</button>',
          decline: '<button type="button" class="btn btn-danger" id="webrtc-decline-btn">Decline</button>',
          answerButtons: '<div id="webrtc-answer-button-container" style="display:none;"></div>',
          endcall: '<div id="webrtc-endcall-button-container" style="display:none;"><button type="button" class="btn btn-danger" id="webrtc-endcall-btn">End call</button></div>'
        },
        video: '<div id="webrtc-video-panel" class="modal-content" style="display:none;"><video id="webrtc-them" autoplay></video><video id="webrtc-me" autoplay muted></video></div>'
      };

      var modalBody = modal.find('.modal-body');
      if (!modalBody.length) {
        modalBody = modal;
      }

      modalBody
        .append(html.buttons.answerButtons)
        .append(html.buttons.endcall)
        .append(html.video);

      modal.find(p.config.selectors.container.answerButtons).append(html.buttons.answer + html.buttons.decline);

      var inputButtons = modal.find('.input-group-btn');
      if (!inputButtons.length) {
        inputButtons = modal.find('.chat-input button').last().parent();
      }
      if (inputButtons.length) {
        inputButtons.append(html.buttons.call);
      }

      Base.connectToRoom(modal);
    },

    connectToRoom: function (modal) {
      var peerUid = p.utils.getUID(modal);
      if (!peerUid) {
        return;
      }

      var ids = [String(app.uid), String(peerUid)].sort();
      var roomName = p.config.roomPrefix + ids[0] + '-' + ids[1];
      var currentRoom = modal.data(p.config.dataKeys.room);

      if (currentRoom === roomName) {
        Base.addActionListeners(modal);
        Base.addEventListeners(modal);
        return;
      }

      easyrtc.joinRoom(
        roomName,
        null,
        function () {
          modal.data(p.config.dataKeys.room, roomName);
          Base.addActionListeners(modal);
          Base.addEventListeners(modal);
        },
        function (errID, errText) {
          app.alertError('Something went wrong while joining this chat...');
          console.error('[nodebb-plugin-webrtc] joinRoom error', errID, errText);
        }
      );
    },

    leaveRoom: function (modal) {
      var roomName = modal.data(p.config.dataKeys.room);

      if (window.easyrtc && typeof easyrtc.hangupAll === 'function') {
        easyrtc.hangupAll();
      }

      if (roomName && window.easyrtc && typeof easyrtc.leaveRoom === 'function') {
        easyrtc.leaveRoom(roomName);
      }

      p.utils.modal.close(modal);
    },

    addActionListeners: function (modal) {
      var actions = p.actions;
      for (var a in actions) {
        if (Object.prototype.hasOwnProperty.call(actions, a) && a !== 'load') {
          actions[a].register(modal);
        }
      }
    },

    addEventListeners: function (modal) {
      var events = p.events;
      for (var e in events) {
        if (Object.prototype.hasOwnProperty.call(events, e) && e !== 'load') {
          events[e].register(modal);
        }
      }
    }
  };

  return function (Plugin) {
    Plugin.base = Base;
    p = Plugin;
  };
});
