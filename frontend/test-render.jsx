global.window = {
  location: { origin: 'http://localhost:3000', hash: '', pathname: '/admin.html', search: '' },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  querySelector: () => null,
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {} })
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.fetch = async () => ({
  json: async () => ({ success: true, data: {} }),
  ok: true
});
global.navigator = { userAgent: 'node' };

import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AdminStudio from './src/pages/AdminStudio.jsx';

try {
  console.log('Rendering AdminStudio...');
  const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(AdminStudio, null)));
  console.log('SUCCESS! Rendered length:', html.length);
} catch (err) {
  console.error('=== CAUGHT CRASH IN ADMINSTUDIO ===');
  console.error(err);
}
