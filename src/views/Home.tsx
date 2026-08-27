import type { FC } from 'hono/jsx';
import { Layout } from './Layout';
import { products } from '../data';

export const Home: FC = () => {
  return (
    <Layout>
      <h1>Welcome to WebMCP Store</h1>
      <p>This example site features a WebMCP enabled commerce store that is written as a Multi-Page Application (MPA)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {products.slice(0,6).map(product => (
          <div class="card">
            <h3>{product.name}</h3>
            <p>${product.price.toFixed(2)}</p>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </Layout>
  );
};
