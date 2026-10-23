// src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <main className="p-4 max-w-7xl mx-auto text-center">
    <h1 className="text-4xl font-bold mb-4">404 – Page Not Found</h1>
    <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
    <Link to="/" className="text-indigo-600 hover:underline">Return to Home</Link>
  </main>
);

export default NotFound;
