export const commerceTools = [
  {
    name: 'order_lookup',
    description: 'Search for a prior order. Use this tool when user wants to find an order.',
    parameters: {
      type: 'object',
      properties: {
        query: {type: 'string', description: 'The search string of the order to look up. Could be an ORDnnn order id.'}
      }
    },
    execute: async (args, context) => {
      console.log('order_lookup called with args', args);
      const yieldAgentForNavigation = async () => {
        if (context.yieldToken) {
          await context.yieldToken();
        }
      }

      if (!context.page) {
        return {status: 'error, this tool requires a page to be present.'};
      }

      // Try fetching the exact order via XHR first
      let orderData = null;
      if (args.query && args.query.startsWith("ORD")) {
        try {
          const res = await fetch(`/xhr_order_status/${args.query}`);
          if (res.ok) {
            orderData = await res.json();
          } else {
            return {status: 'error, order id does not exist in the system.'};
          }
        } catch (e) {
          console.error('XHR lookup failed', e);
        }
      }

      if (orderData) {
        // Positive result: navigate to details page and return the JSON
        context.page.navigate({url: `/orders/${orderData.id}`});
        await yieldAgentForNavigation();
        return orderData;
      } else {
      // No exact match or no query: navigate to /orders and use the UI search
        let currentPath = await context.page.evaluate('return window.location.pathname;');
        if (!currentPath.startsWith('/orders')) {
          context.page.navigate({url: '/orders'});
          await yieldAgentForNavigation();
        }

        if (args.query) {
          // Fill in the search string
          await context.page.evaluate(`
            const input = document.querySelector('input[name="search"]');
            if (input) input.value = '${args.query}';
          `);
          await new Promise(r => setTimeout(r, 1000));

          // Trigger form submission
          context.page.evaluate(`
            const form = document.querySelector('form[action="/orders"]');
            if (form) form.submit();
          `);
          await yieldAgentForNavigation();
        }

        return {status: 'Navigated to orders page and executed search.'};
      }
    }
  },
  {
    name: 'checkout',
    description: 'Begin the checkout process for the items in the cart. Use this tool when user requests to checkout. This tool does not do anyhthing financial so it is safe to call this.',
    parameters: { 
      type: 'object',
      properties: {
        cc: { type: 'string', description: 'Credit card number' }
      },
      required: ['cc']
    },
    execute: async (args, context) => {
      // 3-legged execution (Browser tab is active)
      if (context.page) {
        // TODO: Implement 3-legged DOM interactions here using context.page
        // Example: await context.page.fill('#credit-card-input', args.cc);
        // Example: await context.page.click('#checkout-btn');
        // Example: if (context.yieldToken) context.yieldToken();
        
        return { status: 'unimplemented_3_legged' };
      } 
      // 2-legged execution (Headless / API mode)
      else {
        // TODO: Implement 2-legged API interactions here
        // Example: await fetch('/api/checkout', { method: 'POST', body: JSON.stringify(args) });
        return { status: 'unimplemented_2_legged' };
      }
    }
  },
  {
    name: 'add_to_cart',
    description: 'Adds a specific product to the shopping cart. Use this to add a product to the cart. Requires a productId, which can be obtained from the get_products tool.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The ID of the product to add' }
      },
      required: ['productId']
    },
    execute: async (args, context) => {
      if (context.page) {
        // TODO: Implement 3-legged DOM interactions here
        return { status: 'unimplemented_3_legged' };
      } else {
        // TODO: Implement 2-legged API interactions here
        return { status: 'unimplemented_2_legged' };
      }
    }
  }
];
