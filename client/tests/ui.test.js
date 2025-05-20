/**
 * @jest-environment jsdom
 */

import { createApp } from 'vue';
import HomeView from './HomeView.vue';

describe('HomeView.vue UI Existence Test', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render HomeView and contain key UI elements', async () => {
    const app = createApp(HomeView);
    app.mount(root);

    // Check for the main container
    const homeContainer = root.querySelector('.home-container');
    expect(homeContainer).not.toBeNull();

    // Check for the quick-actions-toggle custom element
    const quickActionsToggle = root.querySelector('quick-actions-toggle');
    expect(quickActionsToggle).not.toBeNull();

    // Check for the chat panel
    const chatPanel = root.querySelector('.chat-panel');
    expect(chatPanel).not.toBeNull();
  });
});
