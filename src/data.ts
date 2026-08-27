export interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: string;
  trackingNumber: string;
  shippingAddress: string;
}

export const mockOrders: Order[] = Array.from({ length: 100 }, (_, i) => {
  const orderNum = (1000 + i).toString();
  return {
    id: `ORD-${orderNum}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
    items: [`Product A`, `Product B`].slice(0, Math.floor(Math.random() * 2) + 1),
    total: parseFloat((Math.random() * 200 + 20).toFixed(2)),
    status: i % 5 === 0 ? 'Delivered' : 'Processing',
    trackingNumber: `TRK${Math.random().toString().substring(2, 10)}`,
    shippingAddress: `${Math.floor(Math.random() * 9000) + 100} Main St, City, Country`,
  };
});

export const products = [
  { id: '1', name: 'Premium Widget', price: 49.99 },
  { id: '2', name: 'Super Gadget', price: 89.99 },
  { id: '3', name: 'Everyday Gizmo', price: 19.99 },
];
