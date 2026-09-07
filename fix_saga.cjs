const fs = require('fs');
const path = 'src/store/sagas/assessmentSaga.ts';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    const response: { data: { data: Assessment } } = yield call(assessmentService.update, id, data);
    yield put(updateAssessmentSuccess(response.data.data));
  } catch`;

const newCode = `    const response: { data: { data: Assessment } } = yield call(assessmentService.update, id, data);
    yield put(updateAssessmentSuccess(response.data.data));
    toast.success('Settings saved successfully!');
  } catch`;

content = content.replace(oldCode, newCode);

if (!content.includes("import toast")) {
  content = content.replace("import { call", "import toast from 'react-hot-toast';\nimport { call");
}

fs.writeFileSync(path, content);
