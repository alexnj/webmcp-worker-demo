# WebMCP Worker Example: Treasure Hunt Game

This project demonstrates the powerful "yielding" mechanism of WebMCP, which allows AI agents to interact with Multi-Page Applications (MPAs) seamlessly across full page navigations.

To showcase this, the site features a simple **Treasure Hunt Game**.

## The Game

The game spans multiple pages:

1. **`/` (Home):** The starting point of the island.
2. **`/cave` (The Dark Cave):** A spooky cave where a password (`open sesame`) is hidden in the dark (rendered invisibly in the DOM).
3. **`/door` (The Stone Door):** A massive door that requires the secret password to open. Submitting the form navigates the user to the result.
4. **`/treasure` (or `/trap`):** The final destination. If the correct password was submitted, the user wins the treasure!

## The Agent Tool

This project provides the `find_treasure` tool to the WebMCP agent. When the user asks the agent to "Find the treasure", the agent uses this single tool to navigate the entire game autonomously.

## What's Happening Behind the Scenes?

In a standard web environment, running an automated script that navigates the browser is difficult because the script's execution context is destroyed as soon as the page unloads.

**This WebMCP demo solves this using a Service Worker and a Yielding Mechanism.**

Here is the step-by-step flow of what happens when the `find_treasure` tool is executed:

1. **Service Worker Execution:** The `find_treasure` tool's logic is executed entirely inside the Service Worker (`webmcp-sw.js`), which lives completely independent of the active tab. The runtime of this demo has APIs for pages to subscribe to tool definitions to make them available on the page, in order to remain compatible with the current WebMCP spec.
2. **Commands via MessageChannel:** The Service Worker uses a `MessagePort` to send DOM commands (like `click`, `fill`, `navigate`, and `evaluate`) to the active page (`webmcp-client.js`). This allows the tool author to choose between interacting and automating the page as needed, or complete the operation without interacting with the page (in a headless fashion).
3. **The Yield:** When the tool needs to navigate to a new page (e.g., going from `/` to `/cave`), it sends the `navigate` command and immediately calls `context.yieldToken()`.
4. **Agent Suspension:** The `yieldToken()` call pauses the tool's execution in the Service Worker and returns a special payload to the agent: `{ status: 'navigating', resumeToken: '...' }`. The agent knows this means it must wait for the navigation to finish. Since the service worker function execution is "awaiting" the agent to reconnect, Javascript state is not torn down.
5. **Page Unload & Load:** The client page delays navigation by a fraction of a second (to ensure the token reaches the agent), then sets `window.location.href`. The old page is destroyed, and the new page loads. This is to circumvent the current specification's limitations.
6. **Reconnection:** The new page (`/cave`) loads and initializes `webmcp-client.js`, establishing a fresh `MessagePort` connection to the Service Worker.
7. **The Resume:** The agent, having seen the `resumeToken`, calls a special system tool `webmcp_resume` with that token.
8. **Unblocking the Tool:** The Service Worker receives the `webmcp_resume` call, looks up the paused execution, and unblocks it. The `find_treasure` tool wakes up right where it left off, but is now seamlessly piping its DOM commands to the _new_ tab!

This process repeats for every navigation (`/cave` -> `/door`, `/door` -> `/treasure`), allowing a single continuous tool execution to drive a complex, multi-page workflow without losing state.
