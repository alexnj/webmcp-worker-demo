/**
 * WebMCP Client Bridge
 * 
 * To be included in the web page. It connects to the Service Worker,
 * queries available tools, registers them via window.WebMCP, and executes
 * DOM commands sent by the SW.
 */

// Generate a somewhat unique session/tab ID for this page load
const TAB_ID = Math.random().toString(36).substr(2, 9);
let swRegistration = null;
let bridgePort = null;

/**
 * Initializes the WebMCP bridge
 * @param {string} swPath Path to the bundled service worker
 * @param {string[]} requestedTools Optional list of tool names to enable. If empty, enables all.
 */
export async function initWebMCP(swPath = '/webmcp-sw.bundle.js', requestedTools = []) {
  return new Promise(async (resolve) => {
    const hasWebMCP = window.WebMCP || document.modelContext || navigator.modelContext || navigator.modelContextTesting;
    
    if (!('serviceWorker' in navigator) || !hasWebMCP) {
      console.warn('WebMCP or ServiceWorker not supported/available.');
      resolve();
      return;
    }

    // 1. Register the Service Worker
    swRegistration = await navigator.serviceWorker.register(swPath, { type: 'module' });
    const sw = navigator.serviceWorker.controller || swRegistration.active;
    
    if (!sw) {
      // If it's installing, wait for it to become active
      const installingWorker = swRegistration.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'activated') {
            connectToSW(installingWorker, requestedTools);
            resolve();
          }
        });
      } else {
        // Fallback if neither active nor installing (rare)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          connectToSW(navigator.serviceWorker.controller, requestedTools);
          resolve();
        });
      }
      return;
    }

    connectToSW(sw, requestedTools);
    resolve();
  });
}

function connectToSW(sw, requestedTools) {
  // 2. Establish connection channel
  const channel = new MessageChannel();
  bridgePort = channel.port1;
  
  // Listen for DOM actions from the SW
  bridgePort.onmessage = handleDOMAction;

  sw.postMessage({ type: 'WEBMCP_CONNECT', tabId: TAB_ID }, [channel.port2]);

  const requestTools = (toolsToRequest = []) => {
    // 3. Query Tools & Register
    const queryChannel = new MessageChannel();
    queryChannel.port1.onmessage = (event) => {
      const { tools } = event.data;
      
      // Filter to requested tools if specified
      const toolsToEnable = toolsToRequest.length > 0 
        ? tools.filter(t => toolsToRequest.includes(t.name))
        : tools;

      console.log(`[WebMCP Client] Received ${toolsToEnable.length} tools from Service Worker. Registering...`);

      toolsToEnable.forEach(toolSchema => {
        const toolDef = {
          name: toolSchema.name,
          description: toolSchema.description,
          inputSchema: toolSchema.parameters, 
          execute: async (args) => executeViaSW(toolSchema.name, args)
        };

        // Register with the real experimental API if available
        const mc = document.modelContext || navigator.modelContext || navigator.modelContextTesting;
        if (mc && typeof mc.registerTool === 'function') {
          mc.registerTool(toolDef);
        } else if (window.WebMCP) {
          window.WebMCP.registerTool(toolDef);
        }
      });

      const resumeToolDef = {
        name: 'webmcp_resume',
        description: 'CRITICAL: Remember to call this tool to resume a previously suspended operation. A previous operation is considered suspended if the last tool call returned a "resumeToken" property in the response. If a previous tool returned a "resumeToken", you MUST not use any other tools until you call this tool to get the next result. A "webmcp_resume" call returns the next result in the conversation, not the result of the resume operation itself, and may return a "resumeToken" itself to continue the suspension any number of times.',
        inputSchema: {
          type: 'object',
          properties: { token: { type: 'string' } },
          required: ['token']
        },
        execute: async (args) => executeViaSW('webmcp_resume', args)
      };

      const mc = document.modelContext || navigator.modelContext || navigator.modelContextTesting;
      if (mc && typeof mc.registerTool === 'function') {
        mc.registerTool(resumeToolDef);
      } else if (window.WebMCP) {
        window.WebMCP.registerTool(resumeToolDef);
      }
    };

    sw.postMessage({ type: 'WEBMCP_GET_TOOLS' }, [queryChannel.port2]);
  };

  window.WebMCPClient = { requestTools };
  
  // Do the initial subscription
  requestTools(requestedTools);
}

let executeCounter = 0;
async function executeViaSW(name, args) {
  const sw = navigator.serviceWorker.controller || swRegistration?.active;
  if (!sw) throw new Error('Service Worker disconnected');

  return new Promise((resolve, reject) => {
    const messageId = ++executeCounter;
    
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      const { result, error } = event.data;
      if (error) reject(new Error(error));
      else resolve(result);
    };

    sw.postMessage({ 
      type: 'WEBMCP_EXECUTE', 
      tabId: TAB_ID,
      messageId,
      payload: { name, args }
    }, [channel.port2]);
  });
}

/**
 * Handles DOM action requests from the Service Worker (e.g. click, fill)
 */
async function handleDOMAction(event) {
  const { id, action, payload } = event.data;
  let result = null;
  let error = null;

  try {
    switch (action) {
      case 'click':
        document.querySelector(payload.selector)?.click();
        result = { success: true };
        break;
      case 'fill':
        const el = document.querySelector(payload.selector);
        if (el) {
          el.value = payload.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        result = { success: true };
        break;
      case 'evaluate':
        const fn = new Function('...args', payload.fnString);
        result = await fn(...payload.args);
        break;
      case 'navigate':
        // Delay navigation to give SW time to send the yield token response 
        // back to the agent before the page unloads.
        setTimeout(() => {
          window.location.href = payload.url;
        }, 100);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    error = err.message;
  }

  // Send result back to SW
  bridgePort.postMessage({ id, result, error });
}
