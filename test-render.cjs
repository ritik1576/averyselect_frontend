require('ts-node').register({ transpileOnly: true });
const React = require('react');
const { renderToString } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const { CandidateDetailReport } = require('./src/pages/Candidate/CandidateDetailReport.tsx');

try {
  const html = renderToString(
    React.createElement(MemoryRouter, null, 
      React.createElement(CandidateDetailReport)
    )
  );
  console.log("Render successful, HTML length:", html.length);
} catch (e) {
  console.error("Render failed:", e);
}
