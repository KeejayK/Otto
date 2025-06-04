/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('UI Elements Test', () => {
  let html;

  beforeAll(() => {
    // Load the HTML from your Vue app's compiled output or snapshot
    html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
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

  test('Quick actions toggle exists and has correct attributes', () => {
    const toggle = document.querySelector('#quick-actions-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle.tagName.toLowerCase()).toBe('button'); // assert it's a button
    expect(toggle.getAttribute('aria-label')).toBeTruthy(); // check accessibility
    expect(toggle.getAttribute('id')).toBe('quick-actions-toggle');
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

  test('Login form elements are present', () => {
    // Assuming your login form has a specific ID or class
    const loginForm = document.querySelector('form#login-form'); // Adjust if necessary
    expect(loginForm).not.toBeNull();

    const emailInput = loginForm.querySelector('input[type="email"]');
    expect(emailInput).not.toBeNull();
    expect(emailInput.getAttribute('placeholder')).toBeTruthy();

    const passwordInput = loginForm.querySelector('input[type="password"]');
    expect(passwordInput).not.toBeNull();
    expect(passwordInput.getAttribute('placeholder')).toBeTruthy();

    const loginButton = loginForm.querySelector('button[type="submit"]');
    expect(loginButton).not.toBeNull();
    expect(loginButton.textContent).toMatch(/login/i);
  });

  test('Favicon is correctly linked', () => {
    const favicon = document.querySelector('link[rel="icon"]');
    expect(favicon).not.toBeNull();
    expect(favicon.getAttribute('type')).toBe('image/png');
    expect(favicon.getAttribute('href')).toBe('/src/assets/o-logo.png');
  });

  test('Document title is correct', () => {
    expect(document.title).toBe('otto');
  });
});
