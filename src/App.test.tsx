import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AMPS Browser header', () => {
  render(<App />);
  const headerElement = screen.getByText(/AMPS Browser/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders server selector', () => {
  render(<App />);
  const serverLabel = screen.getByText(/AMPS Server:/i);
  expect(serverLabel).toBeInTheDocument();
});

test('renders topic selector', () => {
  render(<App />);
  const topicLabel = screen.getByText(/Topic:/i);
  expect(topicLabel).toBeInTheDocument();
});

test('renders command options', () => {
  render(<App />);
  const queryOption = screen.getByText(/Query \(SOW\)/i);
  const subscribeOptions = screen.getAllByText(/Subscribe/i);
  expect(queryOption).toBeInTheDocument();
  expect(subscribeOptions.length).toBeGreaterThan(0);
});
