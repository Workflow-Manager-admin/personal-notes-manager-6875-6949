import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders Notes app navbar', () => {
  render(<App />);
  const navbar = screen.getByText(/Notes/i);
  expect(navbar).toBeInTheDocument();
});

test('can create a new note', () => {
  render(<App />);
  const createBtn = screen.getByText('+ New Note');
  fireEvent.click(createBtn);
  const titleInput = screen.getByPlaceholderText('Title');
  expect(titleInput).toBeInTheDocument();
});
