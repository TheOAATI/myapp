import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.supabase.co'],
  credentials: true,
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Authentication middleware
async function authenticate(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }

  c.set('userId', user.id);
  await next();
}

// User registration
app.post('/make-server-32ed18bb/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      email_confirm: false
    });

    if (error) {
      console.log('Sign up error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log('Sign up error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Get user events
app.get('/make-server-32ed18bb/events', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: events, error } = await supabaseUser.from('events').select('*').eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ events });
  } catch (error) {
    console.log('Get events error:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

app.post('/make-server-32ed18bb/events', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const eventData = await c.req.json();
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [event], error } = await supabaseUser.from('events').insert({
      ...eventData,
      user_id: userId
    }).select();
    
    if (error) throw error;
    
    return c.json({ event });
  } catch (error) {
    console.log('Create event error:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

app.put('/make-server-32ed18bb/events/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const eventId = c.req.param('id');
    const updates = await c.req.json();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [updatedEvent], error } = await supabaseUser.from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    if (!updatedEvent) return c.json({ error: 'Event not found' }, 404);
    
    return c.json({ event: updatedEvent });
  } catch (error) {
    console.log('Update event error:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

app.delete('/make-server-32ed18bb/events/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const eventId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { error } = await supabaseUser.from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.log('Delete event error:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

// Update upcoming to use Postgres

app.get('/make-server-32ed18bb/events/upcoming', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '10');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: events, error } = await supabaseUser.from('events').select('*').eq('user_id', userId);
    
    if (error) throw error;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const upcomingEvents = events
      .filter(event =&gt; {
        if (event.date &gt; today) return true;
        if (event.date === today &amp;&amp; event.start_time &amp;&amp; event.start_time &gt; currentTime) return true;
        return false;
      })
      .sort((a, b) =&gt; {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.start_time &amp;&amp; b.start_time) return a.start_time.localeCompare(b.start_time);
        if (a.start_time &amp;&amp; !b.start_time) return 1;
        if (!a.start_time &amp;&amp; b.start_time) return -1;
        return 0;
      })
      .slice(0, limit);
    
    return c.json({ events: upcomingEvents });
  } catch (error) {
    console.log('Get upcoming events error:', error);
    return c.json({ error: 'Failed to fetch upcoming events' }, 500);
  }
});

// Add endpoints for graphs

app.get('/make-server-32ed18bb/graphs', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: graphs, error } = await supabaseUser.from('graphs').select('*').eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ graphs });
  } catch (error) {
    console.log('Get graphs error:', error);
    return c.json({ error: 'Failed to fetch graphs' }, 500);
  }
});

app.post('/make-server-32ed18bb/graphs', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const graphData = await c.req.json();
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [graph], error } = await supabaseUser.from('graphs').insert({
      ...graphData,
      user_id: userId
    }).select();
    
    if (error) throw error;
    
    return c.json({ graph });
  } catch (error) {
    console.log('Create graph error:', error);
    return c.json({ error: 'Failed to create graph' }, 500);
  }
});

app.put('/make-server-32ed18bb/graphs/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const graphId = c.req.param('id');
    const updates = await c.req.json();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [updatedGraph], error } = await supabaseUser.from('graphs')
      .update(updates)
      .eq('id', graphId)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    if (!updatedGraph) return c.json({ error: 'Graph not found' }, 404);
    
    return c.json({ graph: updatedGraph });
  } catch (error) {
    console.log('Update graph error:', error);
    return c.json({ error: 'Failed to update graph' }, 500);
  }
});

app.delete('/make-server-32ed18bb/graphs/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const graphId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { error } = await supabaseUser.from('graphs')
      .delete()
      .eq('id', graphId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ message: 'Graph deleted successfully' });
  } catch (error) {
    console.log('Delete graph error:', error);
    return c.json({ error: 'Failed to delete graph' }, 500);
  }
});

// Add endpoints for journals

app.get('/make-server-32ed18bb/journals', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: journals, error } = await supabaseUser.from('journals').select('*').eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ journals });
  } catch (error) {
    console.log('Get journals error:', error);
    return c.json({ error: 'Failed to fetch journals' }, 500);
  }
});

app.post('/make-server-32ed18bb/journals', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const journalData = await c.req.json();
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [journal], error } = await supabaseUser.from('journals').insert({
      ...journalData,
      user_id: userId
    }).select();
    
    if (error) throw error;
    
    return c.json({ journal });
  } catch (error) {
    console.log('Create journal error:', error);
    return c.json({ error: 'Failed to create journal' }, 500);
  }
});

app.put('/make-server-32ed18bb/journals/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const journalId = c.req.param('id');
    const updates = await c.req.json();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { data: [updatedJournal], error } = await supabaseUser.from('journals')
      .update(updates)
      .eq('id', journalId)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    if (!updatedJournal) return c.json({ error: 'Journal not found' }, 404);
    
    return c.json({ journal: updatedJournal });
  } catch (error) {
    console.log('Update journal error:', error);
    return c.json({ error: 'Failed to update journal' }, 500);
  }
});

app.delete('/make-server-32ed18bb/journals/:id', authenticate, async (c) =&gt; {
  try {
    const userId = c.get('userId');
    const journalId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    
    const { error } = await supabaseUser.from('journals')
      .delete()
      .eq('id', journalId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return c.json({ message: 'Journal deleted successfully' });
  } catch (error) {
    console.log('Delete journal error:', error);
    return c.json({ error: 'Failed to delete journal' }, 500);
  }
});

Deno.serve(app.fetch)