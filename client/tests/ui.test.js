/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('UI Elements Test', () => {
  let html;

  beforeAll(() => {
    // Load the HTML from your Vue app's compiled output or snapshot
    html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
    document.documentElement.innerHTML = html;
  });

  test('App loads and contains expected root element', () => {
    const app = document.getElementById('app');
    expect(app).not.toBeNull();
  });

  test('Chat panel exists', () => {
    const panel = document.querySelector('.chat-panel');
    expect(panel).not.toBeNull();
  });

  test('Send button exists and is enabled', () => {
    const sendBtn = document.querySelector('#send-button');
    expect(sendBtn).not.toBeNull();
    expect(sendBtn.disabled).toBe(false);
  });

  test('Message input field has placeholder and is not disabled', () => {
    const input = document.querySelector('#message-input');
    expect(input).not.toBeNull();
    expect(input.getAttribute('placeholder')).toMatch(/type.*message/i);
    expect(input.disabled).toBe(false);
  });

  test('Logo image has correct alt and src', () => {
    const logo = document.querySelector('img.logo');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('alt')).toMatch(/logo/i);
    expect(logo.getAttribute('src')).toMatch(/\.(png|svg|jpg)$/);
  });
});
