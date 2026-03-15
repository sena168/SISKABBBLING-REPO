export type Role = 'admin' | 'leader' | 'member' | 'stakeholder';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: Role;
  userId: string;
}

export interface ChatEvent {
  id: string;
  event_type: string;
  sender_name: string | null;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  timestamp_wa: string;
  is_deleted: boolean;
  is_edited: boolean;
  edit_of_id: string | null;
}

export interface EventHistory {
  id: string;
  event_id: string;
  changed_by: string;
  change_type: 'edit' | 'delete';
  old_body: string | null;
  old_media_url: string | null;
  timestamp_log: string;
}

export interface HealthLog {
  service: string;
  status: 'ok' | 'warning' | 'error';
  ts: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  firebase_uid: string;
  role: Role;
  is_active: boolean;
  wa_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  ts: string;
}
