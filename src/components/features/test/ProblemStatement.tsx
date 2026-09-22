import React from 'react';
import './ProblemStatement.css';

interface Section {
  type: 'intro' | 'section' | 'example';
  heading?: string;
  body: string[];
  exampleInput?: string;
  exampleOutput?: string;
  exampleExplanation?: string;
}

const SECTION_KEYWORDS = [
  'input format',
  'output format',
  'constraints',
  'note',
  'notes',
  'explanation',
  'examples',
  'example',
];

const EXAMPLE_KEYWORDS = ['example', 'examples', 'sample input', 'sample output'];

function parseDescription(raw: string): Section[] {
  if (!raw?.trim()) return [];

  // Normalize line endings
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const sections: Section[] = [];
  let currentSection: Section = { type: 'intro', body: [] };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this line is a section heading (exact match, short, no period at end)
    const lowerTrimmed = trimmed.toLowerCase();
    const isSectionHeading =
      trimmed.length > 0 &&
      trimmed.length <= 40 &&
      !trimmed.endsWith('.') &&
      SECTION_KEYWORDS.some((kw) => lowerTrimmed === kw || lowerTrimmed.startsWith(kw + ' '));

    if (isSectionHeading) {
      // Push current section if it has content
      if (currentSection.body.some((b) => b.trim()) || currentSection.heading) {
        sections.push(currentSection);
      }

      const isExample = EXAMPLE_KEYWORDS.some(
        (kw) => lowerTrimmed === kw || lowerTrimmed.startsWith(kw)
      );

      if (isExample) {
        // Collect example input/output
        const exSection: Section = {
          type: 'example',
          heading: trimmed,
          body: [],
        };

        i++;
        let exBody: string[] = [];

        while (i < lines.length) {
          const nextLine = lines[i].trim();
          const nextLower = nextLine.toLowerCase();
          const isNextSection = SECTION_KEYWORDS.some(
            (kw) => nextLower === kw || nextLower.startsWith(kw)
          );
          if (isNextSection && nextLine.length <= 40 && !nextLine.endsWith('.')) break;
          exBody.push(lines[i]);
          i++;
        }

        // Try to split into Input / Output blocks
        const inputMatch = exBody.findIndex(
          (l) => l.trim().toLowerCase() === 'input' || l.trim().toLowerCase() === 'input:'
        );
        const outputMatch = exBody.findIndex(
          (l) => l.trim().toLowerCase() === 'output' || l.trim().toLowerCase() === 'output:'
        );
        const explanationMatch = exBody.findIndex((l) =>
          l.trim().toLowerCase().startsWith('explanation')
        );

        if (inputMatch !== -1 && outputMatch !== -1) {
          const inputLines = exBody.slice(inputMatch + 1, outputMatch).filter((l) => l.trim());
          const explanationStart = explanationMatch !== -1 ? explanationMatch : exBody.length;
          const outputLines = exBody
            .slice(outputMatch + 1, explanationStart)
            .filter((l) => l.trim());
          const explanationLines =
            explanationMatch !== -1 ? exBody.slice(explanationMatch + 1) : [];

          exSection.exampleInput = inputLines.join('\n');
          exSection.exampleOutput = outputLines.join('\n');
          if (explanationLines.length)
            exSection.exampleExplanation = explanationLines.join('\n').trim();
        } else {
          // No clear split — just show as raw block
          exSection.body = exBody;
        }

        sections.push(exSection);
        currentSection = { type: 'intro', body: [] };
        continue;
      } else {
        currentSection = { type: 'section', heading: trimmed, body: [] };
      }
    } else if (trimmed === '') {
      // Keep empty lines as paragraph separators
      if (currentSection.body.length && currentSection.body[currentSection.body.length - 1] !== '') {
        currentSection.body.push('');
      }
    } else {
      currentSection.body.push(trimmed);
    }

    i++;
  }

  if (currentSection.body.some((b) => b.trim()) || currentSection.heading) {
    sections.push(currentSection);
  }

  return sections;
}

interface ProblemStatementProps {
  description: string;
  className?: string;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ description, className }) => {
  const sections = parseDescription(description);

  if (!sections.length) return null;

  return (
    <div className={`ps-root ${className ?? ''}`}>
      {sections.map((sec, idx) => {
        if (sec.type === 'intro') {
          // Render paragraphs
          const paragraphs = sec.body.join('\n').split(/\n\n+/).filter((p) => p.trim());
          return (
            <div key={idx} className="ps-intro">
              {paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="ps-para">{para.trim()}</p>
              ))}
            </div>
          );
        }

        if (sec.type === 'section') {
          const paragraphs = sec.body.join('\n').split(/\n\n+/).filter((p) => p.trim());
          return (
            <div key={idx} className="ps-section">
              <h3 className="ps-section-heading">{sec.heading}</h3>
              {paragraphs.map((para, pIdx) => {
                // Check if this looks like a constraint list (contains <=, >=, etc.)
                const lines = para.split('\n');
                if (lines.length > 1 || para.includes('<=') || para.includes('>=')) {
                  return (
                    <ul key={pIdx} className="ps-constraint-list">
                      {lines.map((l, lIdx) => l.trim() && (
                        <li key={lIdx} className="ps-constraint-item">
                          <code className="ps-constraint-code">{l.trim()}</code>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return <p key={pIdx} className="ps-para">{para.trim()}</p>;
              })}
            </div>
          );
        }

        if (sec.type === 'example') {
          const exNum = sections.filter((s, sIdx) => s.type === 'example' && sIdx <= idx).length;
          return (
            <div key={idx} className="ps-example">
              <h3 className="ps-section-heading">Example {exNum}</h3>

              {sec.exampleInput !== undefined ? (
                <div className="ps-io-grid">
                  <div className="ps-io-block">
                    <div className="ps-io-label">Input</div>
                    <pre className="ps-io-pre">{sec.exampleInput || '(empty)'}</pre>
                  </div>
                  <div className="ps-io-block">
                    <div className="ps-io-label">Output</div>
                    <pre className="ps-io-pre">{sec.exampleOutput || '(empty)'}</pre>
                  </div>
                </div>
              ) : (
                <pre className="ps-io-raw">{sec.body.join('\n').trim()}</pre>
              )}

              {sec.exampleExplanation && (
                <div className="ps-explanation">
                  <span className="ps-explanation-label">Explanation</span>
                  <p className="ps-explanation-text">{sec.exampleExplanation}</p>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
