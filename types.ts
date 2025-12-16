
// --- CORE DATA TYPES ---

export interface ClientDBRow {
  id: string;
  phone_number: string;
  client_name?: string;
  purchase_date: string;
  duration_months: number;
  subscriptions: string[];
  is_debtor: boolean;
  is_contacted: boolean;
  override_expiration?: boolean;
  deleted: boolean;
  created_at: string;
  client_password?: string;
  game_progress?: any;
  last_active_at?: string;
  manual_credentials?: Record<string, string>; // 'Service Name' -> 'Credential ID'
  
  // Personalization
  theme_color?: string;
  background_image?: string;
  profile_image?: string;
}

export interface AppCredential {
  id: string;
  service: string;
  email: string;
  password: string;
  publishedAt: string; // ISO Date
  isVisible: boolean; 
}

export interface AppCredentialDBRow {
  id: string;
  service: string;
  email: string;
  password: string;
  published_at: string;
  is_visible: boolean;
  created_at: string;
}

export interface AdminUserDBRow {
  id: string;
  username: string;
  password: string;
  created_at?: string;
}

export interface Dorama {
  id: string;
  title: string;
  genre: string;
  thumbnail: string;
  status: 'Watching' | 'Plan to Watch' | 'Completed';
  episodesWatched?: number;
  totalEpisodes?: number;
  season?: number;
  rating?: number; // 1-5
}

export interface SubscriptionDetail {
    purchaseDate: string;
    durationMonths: number;
    isDebtor: boolean;
}

// --- APP STATE TYPES ---

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  
  // Subscription Data
  purchaseDate: string;
  durationMonths: number;
  subscriptionDetails: Record<string, SubscriptionDetail>;
  services: string[];
  isDebtor: boolean;
  overrideExpiration: boolean;

  // Local Data
  watching: Dorama[];
  favorites: Dorama[];
  completed: Dorama[];
  
  // Gamification
  gameProgress: Record<string, any>;

  // Personalization
  themeColor?: string;
  backgroundImage?: string;
  profileImage?: string;
  
  manualCredentials?: Record<string, string>;
}

// --- SUPPORT & SYSTEM TYPES ---

export interface SupportFlowStep {
  id: string;
  message: string;
  options: { 
      label: string; 
      next_step_id: string | null; 
      action?: 'link' | 'copy_credential' | 'check_subscription' | 'open_url'; 
      action_value?: string 
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  options?: { label: string; action: () => void }[];
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  image: string;
  source: string;
}

export interface SystemConfig {
  bannerText: string;
  bannerType: 'info' | 'warning' | 'error' | 'success';
  bannerActive: boolean;
  serviceStatus: Record<string, 'ok' | 'down' | 'maintenance'>;
}