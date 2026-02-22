'use strict';

const SocketPlugins = require.main.require('./src/socket.io/plugins');

const WebRTCPlugin = {};

WebRTCPlugin.init = async ({ router, middleware }) => {
  const renderAdmin = (req, res) => {
    res.render('webrtc/admin', {});
  };

  router.get('/admin/plugins/webrtc', middleware.admin.buildHeader, renderAdmin);
  router.get('/api/admin/plugins/webrtc', renderAdmin);

  SocketPlugins.webrtc = {
    getConfig: WebRTCPlugin.getConfig,
  };
};

WebRTCPlugin.addAdminNavigation = async (header) => {
  header.plugins.push({
    route: '/plugins/webrtc',
    icon: 'fa-phone',
    name: 'WebRTC Chat',
  });
  return header;
};

WebRTCPlugin.getConfig = async () => {
  return {
    running: true,
    mode: 'nodebb-4.8-compat',
  };
};

module.exports = WebRTCPlugin;
