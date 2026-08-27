import { Hono } from 'hono';
import { Home } from './views/Home';
import { Orders } from './views/Orders';
import { OrderDetails } from './views/OrderDetails';
import { mockOrders } from './data';
import { Layout } from './views/Layout';

const app = new Hono();

app.get('/', (c) => {
  return c.html(<Home />);
});

app.get('/orders', (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const searchQuery = c.req.query('search') || '';
  
  let filteredOrders = mockOrders;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredOrders = mockOrders.filter(o => 
      o.id.toLowerCase().includes(q)
    );
  }

  const limit = 10;
  const totalPages = Math.ceil(filteredOrders.length / limit);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (safePage - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return c.html(
    <Orders 
      orders={paginatedOrders} 
      currentPage={safePage} 
      totalPages={totalPages} 
      searchQuery={searchQuery}
    />
  );
});

app.get('/orders/:id', (c) => {
  const id = c.req.param('id');
  const order = mockOrders.find(o => o.id === id);
  
  if (!order) {
    return c.html(
      <Layout>
        <h1>404 - Order Not Found</h1>
        <p>The order {id} could not be found.</p>
        <a href="/orders">Back to Orders</a>
      </Layout>,
      404
    );
  }

  return c.html(<OrderDetails order={order} />);
});

app.get('/cart', (c) => {
  return c.html(
    <Layout>
      <h1>Your Cart</h1>
      <p>Cart is currently empty (demo).</p>
    </Layout>
  );
});

export default app;
