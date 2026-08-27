/**
 * WebMCP Service Worker
 * 
 * Orchestrates tool execution, manages 2-legged vs 3-legged context,
 * and handles Dual-Mode discovery.
 */

import { pageBridge } from './page-bridge.js';
import { allTools } from '../domains/index.js';

class WebMCPExecutionEngine {
  constructor(tools) {
    this.tools = new Map(tools.map(t => [t.name, t]));
  }

  /**
   * Executes a tool with the correct context.
   */
  async executeTool(toolName, args, getTabIdFn = null, yieldTokenFn = null) {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);

    // Prepare context
    const context = {};
    if (getTabIdFn) {
      context.page = pageBridge.createContext(getTabIdFn);
      if (yieldTokenFn) {
        context.yieldToken = yieldTokenFn;
      }
    }

    try {
      return await tool.execute(args, context);
    } catch (err) {
      return { error: err.message };
    }
  }

  getToolSchemas() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters || {}
    }));
  }
}

const engine = new WebMCPExecutionEngine(allTools);

// -------------------------------------------------------------
// 0. Installation & Activation
// -------------------------------------------------------------
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim the clients immediately so `navigator.serviceWorker.controller` is not null on first load.
  event.waitUntil(self.clients.claim());
});

// -------------------------------------------------------------
// 1. Page-Level Discovery & Registration (3-legged)
// -------------------------------------------------------------
const pendingResumes = new Map(); // token -> resolve function
const completedJobs = new Map();  // token -> final result
const activeYields = new Map();   // token -> unblock function

self.addEventListener('message', async (event) => {
  const { type, payload, tabId, messageId } = event.data;
  
  // Page connecting to the bridge
  if (type === 'WEBMCP_CONNECT') {
    pageBridge.registerClient(tabId, event.ports[0], event.source?.id);
    return;
  }

  // Page requesting tool schemas to register
  if (type === 'WEBMCP_GET_TOOLS') {
    event.ports[0].postMessage({ tools: engine.getToolSchemas() });
    return;
  }

  // Page proxying a tool execution request
  if (type === 'WEBMCP_EXECUTE') {
    const { name, args } = payload;
    
    // --- SYSTEM TOOL: webmcp_resume ---
    if (name === 'webmcp_resume') {
      const token = args.token;

      // If the background job is paused waiting for resume, unblock it!
      if (activeYields.has(token)) {
        activeYields.get(token)(tabId);
        activeYields.delete(token);
      }
      
      // If the background job already finished while we were navigating
      if (completedJobs.has(token)) {
        event.ports[0].postMessage({ messageId, result: completedJobs.get(token) });
        completedJobs.delete(token);
      } else {
        // Otherwise, wait for the background job to finish and resolve here
        pendingResumes.set(token, (finalResult) => {
          event.ports[0].postMessage({ messageId, result: finalResult });
        });
      }
      return;
    }

    // --- STANDARD TOOL EXECUTION ---
    let currentYieldedToken = null;
    let currentTabId = tabId;
    const yieldToken = () => {
      return new Promise((resolveYield) => {
        const newToken = `job_${Date.now()}`;
        activeYields.set(newToken, (newTabId) => {
          if (newTabId) currentTabId = newTabId;
          resolveYield();
        });
        
        const payload = { status: 'navigating', resumeToken: newToken };

        if (currentYieldedToken && pendingResumes.has(currentYieldedToken)) {
          // Resolve the pending webmcp_resume call from the previous navigation
          pendingResumes.get(currentYieldedToken)(payload);
          pendingResumes.delete(currentYieldedToken);
        } else {
          // First navigation: instantly resolve the original tool call on the dying page
          event.ports[0].postMessage({ 
            messageId, 
            result: payload 
          });
        }

        currentYieldedToken = newToken;
      });
    };

    try {
      // Start the tool execution
      const result = await engine.executeTool(name, args, () => currentTabId, yieldToken);
      
      if (currentYieldedToken) {
        // The background job finished! Route the result to the resume token.
        if (pendingResumes.has(currentYieldedToken)) {
          pendingResumes.get(currentYieldedToken)(result);
          pendingResumes.delete(currentYieldedToken);
        } else {
          completedJobs.set(currentYieldedToken, result);
        }
      } else {
        // Normal execution (no navigation), return result directly
        event.ports[0].postMessage({ messageId, result });
      }
    } catch (err) {
      event.ports[0].postMessage({ messageId, error: err.message });
    }
  }
});


// -------------------------------------------------------------
// 2. Declarative HTTP Endpoint (2-legged / Headless)
// -------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Example intercept for an SSE execution endpoint
  if (url.pathname === '/.well-known/webmcp/sse') {
    // In a real implementation, you would upgrade to a Server-Sent Events stream here.
    // For this boilerplate, we'll return a simple JSON response for POST executions.
    event.respondWith(new Response('SSE endpoint stub - Implement SSE stream here', { status: 200 }));
  }

  // Example intercept for direct HTTP POST execution
  if (url.pathname === '/api/webmcp/execute' && event.request.method === 'POST') {
    event.respondWith(async function() {
      const body = await event.request.json();
      // Notice: No tabId is passed for 2-legged background execution
      const result = await engine.executeTool(body.name, body.args);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }());
  }
});
