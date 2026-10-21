import { supabase } from '../supabase';

const MAINTENANCE_KEY = 'cb_maintenance_mode';
const MAINTENANCE_DETAILS_KEY = 'cb_maintenance_details';

export interface ProgressItem {
  name: string;
  status: string;
  percent: number;
}

export interface MaintenanceDetails {
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  progress: number;
  progressItems: ProgressItem[];
}

// Default is false (Normal Operations)
export const getInitialMaintenanceState = (): boolean => {
  try {
    const saved = localStorage.getItem(MAINTENANCE_KEY);
    if (saved === 'true') return true;
    return false; // Default normal operations
  } catch (e) {
    return false;
  }
};

export const getMaintenanceDetails = (): MaintenanceDetails => {
  try {
    const saved = localStorage.getItem(MAINTENANCE_DETAILS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Storage error reading details", e);
  }
  return {
    title: "System Upgrade & Performance Break",
    subtitle: "We are currently conducting scheduled infrastructure upgrades to boost server speeds, optimize real-time order picking sync, and ensure 100% database stability.",
    estimatedMinutes: 45,
    progress: 88,
    progressItems: [
      { name: "Database Query Indexing & Acceleration", status: "Completed", percent: 100 },
      { name: "Session Security & Encryption Protocols", status: "Completed", percent: 100 },
      { name: "High-Concurrency Merchant Order Sync", status: "In Progress", percent: 92 },
      { name: "Real-time Balance Caching Engine", status: "Final Testing", percent: 85 }
    ]
  };
};

export const setMaintenanceState = async (active: boolean, details: MaintenanceDetails | null = null): Promise<void> => {
  try {
    localStorage.setItem(MAINTENANCE_KEY, active ? 'true' : 'false');
    if (details) {
      localStorage.setItem(MAINTENANCE_DETAILS_KEY, JSON.stringify(details));
    }
    // Broadcast local event
    window.dispatchEvent(new CustomEvent('cb_maintenance_updated', { detail: { active, details } }));

    // Broadcast across browser tabs
    try {
      const channel = supabase.channel('system_maintenance');
      await channel.send({
        type: 'broadcast',
        event: 'maintenance_toggle',
        payload: { active, details }
      });
    } catch (e) {
      // Ignore broadcast errors
    }
  } catch (e) {
    console.warn("Error setting maintenance state:", e);
  }
};
