import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

// Get user events
app.get('/events', authenticate, async (c) => {
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

app.post('/events', authenticate, async (c) => {
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

app.put('/events/:id', authenticate, async (c) => {
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

app.delete('/events/:id', authenticate, async (c) => {
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

app.get('/events/upcoming', authenticate, async (c) => {
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
      .filter(event => {
        if (event.date > today) return true;
        if (event.date === today && event.start_time && event.start_time > currentTime) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
        if (a.start_time && !b.start_time) return 1;
        if (!a.start_time && b.start_time) return -1;
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

app.get('/graphs', authenticate, async (c) => {
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

app.post('/graphs', authenticate, async (c) => {
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

app.put('/graphs/:id', authenticate, async (c) => {
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

app.delete('/graphs/:id', authenticate, async (c) => {
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

app.get('/journals', authenticate, async (c) => {
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

app.post('/journals', authenticate, async (c) => {
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

app.put('/journals/:id', authenticate, async (c) => {
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

app.delete('/journals/:id', authenticate, async (c) => {
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