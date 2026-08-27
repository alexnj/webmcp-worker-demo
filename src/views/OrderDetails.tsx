import type { FC } from 'hono/jsx';
import { Layout } from './Layout';
import type { Order } from '../data';

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails: FC<OrderDetailsProps> = ({ order }) => {
  return (
    <Layout>
      <div style={{ marginBottom: '20px' }}>
        <a href="/orders">&laquo; Back to Orders</a>
      </div>
      
      <h1>Order Details: {order.id}</h1>
      
      <div class="card">
        <h2>Status: <span style={{ color: order.status === 'Delivered' ? 'green' : 'orange' }}>{order.status}</span></h2>
        <p><strong>Order Date:</strong> {order.date}</p>
        <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>
        <p><strong>Shipping Address:</strong><br />{order.shippingAddress}</p>
      </div>

      <div class="card">
        <h2>Items Summary</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {order.items.map(item => (
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              {item}
            </li>
          ))}
        </ul>
        <h3 style={{ textAlign: 'right' }}>Total: ${order.total.toFixed(2)}</h3>
      </div>
    </Layout>
  );
};
