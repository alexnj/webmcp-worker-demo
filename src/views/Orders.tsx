import type { FC } from 'hono/jsx';
import { Layout } from './Layout';
import type { Order } from '../data';

interface OrdersProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

export const Orders: FC<OrdersProps> = ({ orders, currentPage, totalPages, searchQuery }) => {
  return (
    <Layout>
      <h1>Order History</h1>
      
      <div class="search-bar">
        <form action="/orders" method="get">
          <input 
            type="text" 
            name="search" 
            placeholder="Search by Order ID..." 
            value={searchQuery}
          />
          <button type="submit">Search</button>
          {searchQuery && <a href="/orders" style={{ marginLeft: '10px' }}>Clear</a>}
        </form>
      </div>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div>
          {orders.map(order => (
            <div class="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>
                    <a href={`/orders/${order.id}`}>{order.id}</a>
                  </h3>
                  <p style={{ margin: 0 }}>Date: {order.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>${order.total.toFixed(2)}</strong>
                  <p style={{ margin: '5px 0 0 0', color: order.status === 'Delivered' ? 'green' : 'orange' }}>
                    {order.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div class="pagination">
          {currentPage > 1 && (
            <a href={`/orders?page=${currentPage - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}>
              &laquo; Previous
            </a>
          )}
          <span style={{ padding: '5px 10px' }}>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <a href={`/orders?page=${currentPage + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}>
              Next &raquo;
            </a>
          )}
        </div>
      )}
    </Layout>
  );
};
