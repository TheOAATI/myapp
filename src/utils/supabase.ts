import { createClient } from '@supabase/supabase-js';

import { projectId, publicAnonKey } from './supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

const supabase = createClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      storageKey: 'CustomSupabaseAuth',
    },
  },
);

const apiClient = {
  auth: {
    async signup(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { user: data.user };
    },
    async login(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  },
  events: {
    async getEvents() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
      const userId = user.id;
      const { data: events, error } = await supabase.from('events').select('*').eq('user_id', userId);
      if (error) throw error;
      return { events };
    },
    async createEvent(eventData: any) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
      const userId = user.id;

      const { data: [event], error } = await supabase.from('events').insert({
        ...eventData,
        user_id: userId
      }).select();
      if (error) throw error;
      return { event };
    },
    async updateEvent(id: string, updates: any) {
      const { data: [updatedEvent], error } = await supabase.from('events')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!updatedEvent) throw new Error('Event not found');
      return { event: updatedEvent };
    },
    async deleteEvent(id: string) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Event deleted successfully' };
    },
    async getUpcomingEvents(limit = 10) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
      const userId = user.id;
      const { data: events, error } = await supabase.from('events').select('*').eq('user_id', userId);
      if (error) throw error;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      const upcomingEvents = events
        .filter((event: any) => {
          if (event.date > today) return true;
          if (event.date === today && event.start_time && event.start_time > currentTime) return true;
          return false;
        })
        .sort((a: any, b: any) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
          if (a.start_time && !b.start_time) return 1;
          if (!a.start_time && b.start_time) return -1;
          return 0;
        })
        .slice(0, limit);

      return { events: upcomingEvents };
    },
  },
  graphs: {
    async getGraphs() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
      const userId = user.id;
      const { data: graphs, error } = await supabase.from('graphs').select('*').eq('user_id', userId);
      if (error) throw error;
      return { graphs };
    },
    async createGraph(graphData: any) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
      const userId = user.id;

      const { data: [graph], error } = await supabase.from('graphs').insert({
        ...graphData,
        user_id: userId
      }).select();
      if (error) throw error;
      return { graph };
    },
    async updateGraph(id: string, updates: any) {
      const { data: [updatedGraph], error } = await supabase.from('graphs')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!updatedGraph) throw new Error('Graph not found');
      return { graph: updatedGraph };
    },
    async deleteGraph(id: string) {
      const { error } = await supabase.from('graphs').delete().eq('id', id);
      if (error) throw error;
      return { message: 'Graph deleted successfully' };
    },
  },
  journals: {

    async getJournals() {

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('No authenticated user');

      const userId = user.id;

      const { data: journals, error } = await supabase.from('journals').select('*').eq('user_id', userId);

      if (error) throw error;

      return { journals };

    },

    async createJournal(journalData: any) {

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('No authenticated user');

      const userId = user.id;

      const initialData = {

        ...journalData,

        photos: [],

        drawings: [],

        user_id: userId

      };

      const { data: [journal], error } = await supabase.from('journals').insert(initialData).select();

      if (error) throw error;

      const processedPhotos = await Promise.all(

        (journalData.photos || []).map(async (photo) => {

          const url = photo.url;

          const caption = photo.caption || '';

          if (url.startsWith('data:')) {

            const blob = await fetch(url).then(res => res.blob());

            const fileExt = blob.type.split('/')[1];

            const fileName = `${crypto.randomUUID()}.${fileExt}`;

            const filePath = `${userId}/${journal.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('journal-photos').upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('journal-photos').getPublicUrl(filePath);

            return { url: urlData.publicUrl, caption };

          } else {

            return { url, caption };

          }

        })

      );

      const processedDrawings = await Promise.all(

        (journalData.drawings || []).map(async (drawing) => {

          const url = drawing.url;

          if (url.startsWith('data:')) {

            const blob = await fetch(url).then(res => res.blob());

            const fileExt = 'png';

            const fileName = `${crypto.randomUUID()}.${fileExt}`;

            const filePath = `${userId}/${journal.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('journal-photos').upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('journal-photos').getPublicUrl(filePath);

            return { url: urlData.publicUrl };

          } else {

            return { url };

          }

        })

      );

      const { data: [updatedJournal], error: updateError } = await supabase.from('journals')

        .update({ photos: processedPhotos, drawings: processedDrawings })

        .eq('id', journal.id)

        .select();

      if (updateError) throw updateError;

      return { journal: updatedJournal };

    },

    async updateJournal(id: string, updates: any) {

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('No authenticated user');

      const userId = user.id;

      const processedPhotos = await Promise.all(

        (updates.photos || []).map(async (photo) => {

          const url = photo.url;

          const caption = photo.caption || '';

          if (url.startsWith('data:')) {

            const blob = await fetch(url).then(res => res.blob());

            const fileExt = blob.type.split('/')[1];

            const fileName = `${crypto.randomUUID()}.${fileExt}`;

            const filePath = `${userId}/${id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('journal-photos').upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('journal-photos').getPublicUrl(filePath);

            return { url: urlData.publicUrl, caption };

          } else {

            return { url, caption };

          }

        })

      );

      const processedDrawings = await Promise.all(

        (updates.drawings || []).map(async (drawing) => {

          const url = drawing.url;

          if (url.startsWith('data:')) {

            const blob = await fetch(url).then(res => res.blob());

            const fileExt = 'png';

            const fileName = `${crypto.randomUUID()}.${fileExt}`;

            const filePath = `${userId}/${id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('journal-photos').upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('journal-photos').getPublicUrl(filePath);

            return { url: urlData.publicUrl };

          } else {

            return { url };

          }

        })

      );

      const processedUpdates = {

        ...updates,

        photos: processedPhotos,

        drawings: processedDrawings

      };

      const { data: [updatedJournal], error } = await supabase.from('journals')

        .update(processedUpdates)

        .eq('id', id)

        .select();

      if (error) throw error;

      if (!updatedJournal) throw new Error('Journal not found');

      return { journal: updatedJournal };

    },

    async deleteJournal(id: string) {

      const { data: journals, error: getError } = await supabase.from('journals').select('photos, drawings').eq('id', id);

      if (getError) throw getError;

      const journal = journals?.[0];

      if (journal) {

        for (const photo of journal.photos || []) {

          if (photo.url) {

            const pathParts = photo.url.split('/journal-photos/');

            if (pathParts[1]) {

              const path = pathParts[1];

              await supabase.storage.from('journal-photos').remove([path]);

            }

          }

        }

        for (const drawing of journal.drawings || []) {

          if (drawing.url) {

            const pathParts = drawing.url.split('/journal-photos/');

            if (pathParts[1]) {

              const path = pathParts[1];

              await supabase.storage.from('journal-photos').remove([path]);

            }

          }

        }

      }

      const { error } = await supabase.from('journals').delete().eq('id', id);

      if (error) throw error;

      return { message: 'Journal deleted successfully' };

    },

  },
};

export { supabase, apiClient };