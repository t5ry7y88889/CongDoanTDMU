const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Determine Python executable path (prefer portable/installed Z:\python\python.exe, fallback to system 'python')
function getPythonExecutable() {
  const candidate = 'Z:\\python\\python.exe';
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  return 'python';
}

const SCRIPT_PATH = path.join(__dirname, 'convert_to_markdown.py');

/**
 * Convert a file from disk to Markdown using Microsoft MarkItDown.
 * @param {string} filePath - Absolute path to file
 * @param {number} timeoutMs - Timeout in milliseconds (default 30000)
 * @returns {Promise<{success: boolean, markdown?: string, title?: string, error?: string}>}
 */
async function convertFileWithMarkItDown(filePath, timeoutMs = 30000) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }

  const pythonExec = getPythonExecutable();

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let isResolved = false;

    const child = spawn(pythonExec, [SCRIPT_PATH, filePath], {
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8'
      }
    });

    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        try { child.kill(); } catch (e) {}
        resolve({ success: false, error: `MarkItDown timed out after ${timeoutMs}ms` });
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString('utf-8');
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    child.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        resolve({ success: false, error: `Failed to spawn Python process: ${err.message}` });
      }
    });

    child.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);

        if (code !== 0 && !stdoutData.trim()) {
          return resolve({
            success: false,
            error: `MarkItDown process exited with code ${code}: ${stderrData.trim() || 'Unknown error'}`
          });
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          if (parsed && parsed.success) {
            resolve({
              success: true,
              markdown: parsed.markdown || '',
              title: parsed.title || '',
              charCount: parsed.char_count || (parsed.markdown || '').length
            });
          } else {
            resolve({
              success: false,
              error: parsed?.error || 'MarkItDown conversion failed'
            });
          }
        } catch (jsonErr) {
          resolve({
            success: false,
            error: `Invalid JSON response from MarkItDown: ${stdoutData.slice(0, 300)}`
          });
        }
      }
    });
  });
}

/**
 * Convert an in-memory Buffer to Markdown using Microsoft MarkItDown.
 * Writes buffer to a temporary file, calls convertFileWithMarkItDown, then removes temp file.
 * @param {Buffer} buffer - File buffer
 * @param {string} originalFilename - e.g. "kehoach.docx"
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{success: boolean, markdown?: string, title?: string, error?: string}>}
 */
async function convertBufferWithMarkItDown(buffer, originalFilename = 'document.docx', timeoutMs = 30000) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { success: false, error: 'Invalid buffer' };
  }

  const ext = path.extname(originalFilename || '') || '.bin';
  const tempDir = path.join(os.tmpdir(), 'tdmu_markitdown');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(tempDir, `mid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);

  try {
    fs.writeFileSync(tempFile, buffer);
    const result = await convertFileWithMarkItDown(tempFile, timeoutMs);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      // Ignore temp file cleanup errors
    }
  }
}

module.exports = {
  convertFileWithMarkItDown,
  convertBufferWithMarkItDown
};
