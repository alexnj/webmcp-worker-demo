/**
 * Page Bridge - Service Worker Side
 * 
 * Provides an abstraction for tools to communicate with the active web page.
 * It manages connections to page clients (via MessagePort or Client API) and 
 * handles the pausing/resuming logic during page navigations.
 */

export class PageBridge {
  constructor() {
    // Map of tabId -> MessagePort
    this.connections = new Map();
    // Map of messageId -> resolve/reject promise callbacks
    this.pendingRequests = new Map();
    this.messageCounter = 0;
  }

  /**
   * Called by the Service Worker when a new page client connects.
   */
  registerClient(tabId, port, clientId) {
    this.connections.set(tabId, { port, clientId });
    
    port.onmessage = (event) => {
      const { id, result, error } = event.data;
      if (this.pendingRequests.has(id)) {
        const { resolve, reject } = this.pendingRequests.get(id);
        this.pendingRequests.delete(id);
        if (error) reject(new Error(error));
        else resolve(result);
      }
    };
  }

  /**
   * Called when a client disconnects (e.g. during a navigation).
   */
  unregisterClient(tabId) {
    this.connections.delete(tabId);
  }

  /**
   * Internal method to send a message to a specific tab.
   * If the tab is disconnected (navigating), this will wait and queue
   * the message until the tab reconnects.
   */
  async _sendMessage(tabId, action, payload) {
    // Wait for connection and get the active tabId (it might have changed due to navigation)
    const activeTabId = await this._waitForConnection(tabId);

    return new Promise((resolve, reject) => {
      const id = ++this.messageCounter;
      this.pendingRequests.set(id, { resolve, reject });
      
      const { port } = this.connections.get(activeTabId);
      port.postMessage({ id, action, payload });
    });
  }

  async _waitForConnection(tabId) {
    // If the original tab is still connected, verify it's alive via the Clients API
    const conn = this.connections.get(tabId);
    if (conn && conn.clientId) {
      const client = await self.clients.get(conn.clientId);
      if (client) {
        return tabId; // Client is still alive!
      } else {
        // Client navigated away or closed, clean up its dead port
        this.connections.delete(tabId);
      }
    } else if (conn) {
      return tabId; // Fallback if no clientId was provided
    }
    
    // Otherwise, wait for ANY new tab to connect (Navigation Survival)
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.connections.size > 0) {
          clearInterval(interval);
          // Return the most recently connected tab
          const activeTabId = Array.from(this.connections.keys()).pop();
          resolve(activeTabId);
        }
      }, 100);
    });
  }

  // --- Puppeteer-like Abstractions ---

  createContext(getTabId) {
    return {
      click: async (selector) => {
        return this._sendMessage(getTabId(), 'click', { selector });
      },
      fill: async (selector, value) => {
        return this._sendMessage(getTabId(), 'fill', { selector, value });
      },
      evaluate: async (fnString, args = []) => {
        return this._sendMessage(getTabId(), 'evaluate', { fnString, args });
      },
      navigate: async ({url}) => {
        return this._sendMessage(getTabId(), 'navigate', {url});
      }
    };
  }
}

export const pageBridge = new PageBridge();
