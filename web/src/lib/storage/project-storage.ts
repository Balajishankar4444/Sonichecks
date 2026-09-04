export interface ProjectItem {
  id: string;
  name: string;
  client: string;
  created_at: string;
  files: {
    filename: string;
    version_tag?: string; // 'v1', 'v2', 'FINAL', etc.
    status: 'PASS' | 'WARNING' | 'FAIL';
    profile_name: string;
    sha256: string;
    checked_at: string;
  }[];
}

const PROJECTS_STORAGE_KEY = 'sonichecks_projects_v1';

export function loadProjects(): ProjectItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      // Default initial projects for discovery
      return [
        {
          id: 'proj-demo-1',
          name: 'Midnight EP Master',
          client: 'Apex Music Group',
          created_at: new Date().toISOString(),
          files: [
            {
              filename: 'Track01_Midnight_v1.wav',
              version_tag: 'v1',
              status: 'FAIL',
              profile_name: 'Spotify Streaming',
              sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
              checked_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              filename: 'Track01_Midnight_FINAL.wav',
              version_tag: 'FINAL',
              status: 'PASS',
              profile_name: 'Spotify Streaming',
              sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
              checked_at: new Date().toISOString()
            }
          ]
        }
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load projects:', e);
    return [];
  }
}

export function saveProject(project: ProjectItem): ProjectItem[] {
  if (typeof window === 'undefined') return [];
  const list = loadProjects();
  const idx = list.findIndex(p => p.id === project.id);

  let updated: ProjectItem[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = project;
  } else {
    updated = [project, ...list];
  }

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sonichecks_projects_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save project:', e);
  }
  return updated;
}

export function deleteProject(projectId: string): ProjectItem[] {
  if (typeof window === 'undefined') return [];
  const list = loadProjects();
  const updated = list.filter(p => p.id !== projectId);
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sonichecks_projects_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete project:', e);
  }
  return updated;
}
