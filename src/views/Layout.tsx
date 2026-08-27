import { html } from 'hono/html';
import type { FC } from 'hono/jsx';

export const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <title>Commerce Site</title>
        <style>
          {`
            body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            nav { display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            a { text-decoration: none; color: blue; }
            a:hover { text-decoration: underline; }
            .card { border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
            .pagination { display: flex; gap: 10px; margin-top: 20px; }
            .pagination a { padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; }
            .search-bar { margin-bottom: 20px; }
            input[type="text"] { padding: 8px; width: 250px; margin-right: 10px; }
            button { padding: 8px 15px; cursor: pointer; }
          `}
        </style>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/orders">Orders</a>
          <a href="/cart">View cart</a>
        </nav>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
