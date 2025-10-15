export interface NotiModalProps {
  notis: NotiListProps[];
}

export interface NotiListProps {
  notification_id: bigint;
  user_id?: bigint;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  deleted_at: string;
}
