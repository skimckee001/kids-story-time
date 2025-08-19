// Ultra simple test - no imports, no dependencies
function App() {
  return (
    <div style={{ padding: '50px', backgroundColor: 'lightgreen', minHeight: '100vh' }}>
      <h1>CLEAN TEST APP</h1>
      <p>If you see this, React is working!</p>
      <button onClick={() => alert('Clean test works!')}>
        Click Me
      </button>
    </div>
  );
}

export default App;