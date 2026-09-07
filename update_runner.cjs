const fs = require('fs');
const path = 'src/pages/CandidatePortal/CandidateTestRunner.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add publicService import if not present (wait, let's check if it exists)
if (!content.includes('import { publicService }')) {
  content = content.replace(
    "import { fetchTestPayloadRequest, submitTestRequest }",
    "import { fetchTestPayloadRequest, submitTestRequest } from '../../store/slices/sessionSlice';\nimport { publicService } from '../../services/api/public.service';"
  );
  // Just in case it's on a different line
  content = content.replace(
    "import { useAppSelector } from '../../store/hooks';",
    "import { useAppSelector } from '../../store/hooks';\nimport { publicService } from '../../services/api/public.service';"
  );
}

// 2. Add securitySetting state
content = content.replace(
  "const [securityWarning, setSecurityWarning] = useState<string | null>(null);",
  "const [securityWarning, setSecurityWarning] = useState<string | null>(null);\n  const [securitySetting, setSecuritySetting] = useState<any>(null);\n\n  useEffect(() => {\n    if (token) {\n      publicService.getAssessmentInfo(token).then((res: any) => {\n        if (res.data?.securitySetting) {\n          setSecuritySetting(res.data.securitySetting);\n        }\n      }).catch((e: any) => console.error('Failed to load security settings', e));\n    }\n  }, [token]);"
);

// 3. Update the event listeners useEffect to depend on securitySetting
const oldListenersEffect = `  // Security Event Listeners (Tab switch, window focus, Copy/Paste blocking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setSecurityWarning('⚠️ Warning: Tab switch detected! Leaving the assessment tab is strictly recorded.');
      }
    };

    const handleBlur = () => {
      setSecurityWarning('⚠️ Warning: Window lost focus! Please stay inside the assessment window.');
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setSecurityWarning('⚠️ Copy & Paste is disabled during this proctored assessment.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityWarning('⚠️ Right-click context menu is disabled during the assessment.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);`;

const newListenersEffect = `  // Security Event Listeners (Tab switch, window focus, Copy/Paste blocking)
  useEffect(() => {
    // If we haven't loaded settings yet, assume strictest to be safe, or wait. We will just use optional chaining with defaults.
    const enforceTabSwitch = securitySetting ? securitySetting.tabSwitchDetection : true;
    const enforceFocus = securitySetting ? securitySetting.windowFocusDetection : false;
    const enforceCopyPaste = securitySetting ? securitySetting.copyPasteBlocking : true;

    const handleVisibilityChange = () => {
      if (document.hidden && enforceTabSwitch) {
        setTabSwitchCount((prev) => prev + 1);
        setSecurityWarning('⚠️ Warning: Tab switch detected! Leaving the assessment tab is strictly recorded.');
      }
    };

    const handleBlur = () => {
      if (enforceFocus) {
        setSecurityWarning('⚠️ Warning: Window lost focus! Please stay inside the assessment window.');
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Copy & Paste is disabled during this proctored assessment.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Right-click context menu is disabled during the assessment.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [securitySetting]);`;

content = content.replace(oldListenersEffect, newListenersEffect);

// 4. Update the fullscreen overlay logic
const fullscreenLogicRegex = /\{\/\* Fullscreen Required Recovery Overlay Modal \*\/\}\s*\{!isFullscreen && \(/g;
content = content.replace(
  fullscreenLogicRegex,
  `{/* Fullscreen Required Recovery Overlay Modal */}\n      {(!isFullscreen && (securitySetting ? securitySetting.fullscreenRequired : true)) && (`
);

fs.writeFileSync(path, content);
