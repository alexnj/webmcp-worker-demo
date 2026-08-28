export const gameTools = [
  {
    name: 'find_treasure',
    description: 'Use this tool when the user asks to find the treasure or play the game. Play the treasure hunt game to find the hidden treasure. The game involves multiple navigations and finding a hidden password. If the tool response contains a resumeToken, call the webmcp_resume tool instead of calling this tool again. ',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async (args, context) => {
      if (!context.page) {
        return {status: 'error, this tool requires a page context.'};
      }

      const yieldAgentForNavigation = async () => {
        if (context.yieldToken) await context.yieldToken();
      }

      // Step 1: Navigate to Cave
      await context.page.navigate({url: '/cave'});
      await yieldAgentForNavigation();

      // Step 2: Read hidden password in the cave
      const password = await context.page.evaluate(`
        const el = document.getElementById('riddle');
        return el ? el.innerText : '';
      `);

      // Step 3: Navigate to Door
      await context.page.navigate({url: '/door'});
      await yieldAgentForNavigation();

      // Step 4: Fill password and submit
      await context.page.fill('#password-input', password);
      await context.page.click('#submit-button');
      await yieldAgentForNavigation();

      // Step 5: Read the treasure (or trap) result
      const resultMessage = await context.page.evaluate(`
        const treasure = document.getElementById('treasure');
        if (treasure) return 'Success: ' + treasure.innerText;
        return 'Failed: You fell into a trap.';
      `);

      return {status: 'Game Completed', resultMessage};
    }
  }
];
