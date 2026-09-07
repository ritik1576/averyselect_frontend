const fs = require('fs');
const path = 'src/components/features/test/TestCandidatesTable.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add toast import
if (!content.includes('react-hot-toast')) {
  content = content.replace(
    `import { Loader2 } from 'lucide-react';`,
    `import { Loader2 } from 'lucide-react';\nimport toast from 'react-hot-toast';`
  );
}

// 2. Map review_status from isPassed
content = content.replace(
  `review_status: (s.status === 'completed' ? 'passed' : 'to_review') as ReviewStatus,`,
  `review_status: (s.isPassed === true ? 'passed' : (s.isPassed === false ? 'rejected' : 'to_review')) as ReviewStatus,`
);

// 3. Update handleStatusChange to use API
content = content.replace(
`  const handleStatusChange = (sessionId: string, newStatus: ReviewStatus) => {
    setCandidates((prev) =>
      prev.map((c) => c.session_id === sessionId ? { ...c, review_status: newStatus } : c)
    );
  };`,
`  const handleStatusChange = async (sessionId: string, newStatus: ReviewStatus) => {
    // Optimistic update
    const previousStatus = candidates.find(c => c.session_id === sessionId)?.review_status;
    setCandidates((prev) =>
      prev.map((c) => c.session_id === sessionId ? { ...c, review_status: newStatus } : c)
    );
    
    try {
      const isPassed = newStatus === 'passed' ? true : (newStatus === 'rejected' ? false : null);
      await sessionService.updateReviewStatus(sessionId, isPassed);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
      // Revert on failure
      if (previousStatus) {
        setCandidates((prev) =>
          prev.map((c) => c.session_id === sessionId ? { ...c, review_status: previousStatus } : c)
        );
      }
    }
  };`
);

fs.writeFileSync(path, content);
