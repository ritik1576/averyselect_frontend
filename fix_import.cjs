const fs = require('fs');
const path = 'src/pages/CandidatePortal/CandidateTestRunner.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { publicService } from '../../services/api/public.service'; from '../../store/slices/sessionSlice';",
  "import { fetchTestPayloadRequest, submitTestRequest } from '../../store/slices/sessionSlice';"
);

fs.writeFileSync(path, content);
