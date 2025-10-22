export default App;
import React from 'react';
import './i18n';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Icon from '@mdi/react';
import { mdiHome } from '@mdi/js';

function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <div className="flex justify-center my-4">
          <span className="inline-block">
            <Icon path={mdiHome} size={3} color="green" role="presentation" />
          </span>
        </div>
      </div>
      <h1 className="bg-green-500 text-white p-4 rounded">Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </main>
  );
}
