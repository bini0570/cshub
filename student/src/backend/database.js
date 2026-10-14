/**
 * CS Hub — Backend Database Storage Layer
 * Supports LocalStorage In-Memory store with Supabase integration.
 */

export { supabase, isSupabaseConfigured } from '../lib/supabase';
export { BackendService as Database } from './index';
