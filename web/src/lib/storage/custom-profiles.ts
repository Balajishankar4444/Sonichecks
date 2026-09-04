import { QCProfile } from '@/types/qc';

const CUSTOM_PROFILES_STORAGE_KEY = 'sonichecks_custom_profiles_v1';

export function loadCustomProfiles(): QCProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load custom profiles from storage:', e);
    return [];
  }
}

export function saveCustomProfile(profile: QCProfile): QCProfile[] {
  if (typeof window === 'undefined') return [];
  const existing = loadCustomProfiles();
  const index = existing.findIndex(p => p.profile_id === profile.profile_id);
  
  const updatedProfile: QCProfile = {
    ...profile,
    is_custom: true,
    last_verified_date: new Date().toISOString().split('T')[0]
  };

  let updatedList: QCProfile[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = updatedProfile;
  } else {
    updatedList = [...existing, updatedProfile];
  }

  try {
    localStorage.setItem(CUSTOM_PROFILES_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('sonichecks_custom_profiles_updated', { detail: updatedList }));
  } catch (e) {
    console.error('Failed to save custom profile:', e);
  }

  return updatedList;
}

export function deleteCustomProfile(profileId: string): QCProfile[] {
  if (typeof window === 'undefined') return [];
  const existing = loadCustomProfiles();
  const updatedList = existing.filter(p => p.profile_id !== profileId);
  try {
    localStorage.setItem(CUSTOM_PROFILES_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('sonichecks_custom_profiles_updated', { detail: updatedList }));
  } catch (e) {
    console.error('Failed to delete custom profile:', e);
  }
  return updatedList;
}

export function exportCustomProfilesJson(): string {
  const profiles = loadCustomProfiles();
  return JSON.stringify(profiles, null, 2);
}

export function importCustomProfilesJson(jsonStr: string): QCProfile[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Invalid JSON format: expected an array of profiles');
    
    // Validate each profile minimally
    const validated = parsed.filter(p => p.profile_id && p.name && p.rules);
    if (validated.length === 0) throw new Error('No valid profiles found in JSON');
    
    const existing = loadCustomProfiles();
    const map = new Map<string, QCProfile>();
    existing.forEach(p => map.set(p.profile_id, p));
    validated.forEach(p => map.set(p.profile_id, { ...p, is_custom: true }));
    
    const merged = Array.from(map.values());
    localStorage.setItem(CUSTOM_PROFILES_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('sonichecks_custom_profiles_updated', { detail: merged }));
    return merged;
  } catch (e: any) {
    throw new Error(e.message || 'Failed to import profiles');
  }
}
