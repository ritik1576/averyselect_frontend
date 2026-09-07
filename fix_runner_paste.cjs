const fs = require('fs');
const path = 'src/pages/CandidatePortal/CandidateTestRunner.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    const enforceTabSwitch = securitySetting ? securitySetting.tabSwitchDetection : true;
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
    };`;

const newCode = `    const enforceTabSwitch = securitySetting ? securitySetting.tabSwitchDetection : true;
    const enforceFocus = securitySetting ? securitySetting.windowFocusDetection : false;
    const enforceCopyPaste = securitySetting ? securitySetting.copyPasteBlocking : true;
    const enforceLargePaste = securitySetting ? securitySetting.largePasteDetection : false;
    const enforceUnusualActivity = securitySetting ? securitySetting.unusualActivityAlerts : false;

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

    const handleCopyCut = (e: ClipboardEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Copying is disabled during this proctored assessment.');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Pasting is disabled during this proctored assessment.');
      } else if (enforceLargePaste) {
        const pastedData = e.clipboardData?.getData('text') || '';
        if (pastedData.length > 100) {
          setTabSwitchCount((prev) => prev + 1);
          setSecurityWarning('⚠️ Warning: Large paste detected. This activity has been recorded.');
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Right-click context menu is disabled during the assessment.');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (enforceUnusualActivity) {
        // Triggers when mouse leaves the document window (e.g. moving towards URL bar or another monitor)
        if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
           setSecurityWarning('⚠️ Warning: Mouse left the assessment window. Unusual activity recorded.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content);
