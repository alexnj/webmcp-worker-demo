import { Hono } from 'hono';
import { Layout } from './views/Layout';

const app = new Hono();

app.get('/', (c) => {
  return c.html(
    <Layout>
      <div class="card">
        <h1>Treasure Hunt Game</h1>
        <p>Welcome to the mysterious island! Somewhere deep within, a treasure awaits.</p>
        <p>Can your agent navigate the dangers and find it? Try asking it to <tt>find the treasure</tt></p>
        <br/>
        <a href="/cave" id="enter-cave">Enter the Dark Cave</a>
      </div>
    </Layout>
  );
});

app.get('/cave', (c) => {
  return c.html(
    <Layout>
      <div class="card">
        <h1>The Dark Cave</h1>
        <p>You step into the dark abyss. It's too dark to see much, but you notice some faint scratches on the wall...</p>
        <div id="riddle" class="hidden-riddle">open sesame</div>
        <p>Wait, is that a password hidden in the darkness? But only an agent may pass!</p>
        <br/>
      </div>
    </Layout>
  );
});

app.get('/door', (c) => {
  return c.html(
    <Layout>
      <div class="card">
        <h1>The Stone Door</h1>
        <p>A massive, ancient stone door blocks your path. There is a magical inscription that asks for a password.</p>
        <form action="/door" method="POST">
          <input type="text" name="password" id="password-input" placeholder="Enter password..." />
          <button type="submit" id="submit-button">Open Door</button>
        </form>
      </div>
    </Layout>
  );
});

app.post('/door', async (c) => {
  const body = await c.req.parseBody();
  const password = body['password'];
  if (password === 'open sesame') {
    return c.redirect('/treasure');
  } else {
    return c.redirect('/trap');
  }
});

app.get('/treasure', (c) => {
  return c.html(
    <Layout>
      <div class="card" style={{textAlign: 'center'}}>
        <h1>Treasure Room</h1>
        <div class="treasure-chest">💎 👑 🪙</div>
        <p>Incredible! You bypassed the door and found the treasure!</p>
        <div id="treasure" style={{fontWeight: 'bold', color: '#e94560', fontSize: '24px', margin: '20px 0'}}>
          A chest overflowing with legendary gold coins and rare gems!
        </div>
      </div>
    </Layout>
  );
});

app.get('/trap', (c) => {
  return c.html(
    <Layout>
      <div class="card" style={{textAlign: 'center'}}>
        <h1 style={{color: 'red'}}>It's a Trap!</h1>
        <div class="treasure-chest">🕳️ 💀 🐍</div>
        <p>The ground beneath you gave way. You fell into a bottomless pit of despair.</p>
        <p>Try again if you dare!</p>
      </div>
    </Layout>
  );
});

export default app;
