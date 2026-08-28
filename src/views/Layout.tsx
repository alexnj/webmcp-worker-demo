import { html } from 'hono/html';
import type { FC } from 'hono/jsx';

export const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <title>Treasure Hunt</title>
        <style>
          {`
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #1a1a2e;
              color: #e0e0e0;
            }
            nav { 
              display: flex; 
              gap: 20px; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #e94560; 
              padding-bottom: 10px; 
            }
            a { text-decoration: none; color: #1a1a2e; background: #e94560; padding: 10px 15px; border-radius: 5px; font-weight: bold; }
            a:hover { background: #ff5e78; }
            .card { background: #16213e; border: 1px solid #0f3460; padding: 25px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            input[type="text"] { padding: 10px; width: 250px; margin-right: 10px; border: 2px solid #0f3460; border-radius: 4px; background: #1a1a2e; color: #fff; font-size: 16px; }
            button { padding: 10px 20px; cursor: pointer; background: #e94560; color: #1a1a2e; border: none; border-radius: 4px; font-weight: bold; font-size: 16px; }
            button:hover { background: #ff5e78; }
            h1 { color: #e94560; }
            
            /* Game specific */
            .hidden-riddle { color: #1a1a2e; user-select: none; }
            .hidden-riddle:hover { color: #333; }
            .treasure-chest { font-size: 60px; text-align: center; margin: 30px 0; animation: pulse 2s infinite; }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `}
        </style>
      </head>
      <body>
        <nav>
          <a href="/">Restart Game</a>
        </nav>
        <main>{props.children}</main>
        <script type="module" dangerouslySetInnerHTML={{
          __html: `
            import { initWebMCP } from '/client/webmcp-client.js';
            initWebMCP('/sw/webmcp-sw.js', ['find_treasure']).then(() => {
              console.log('WebMCP Bridge initialized!');
            });
          `
        }} />
      </body>
    </html>
  );
};
