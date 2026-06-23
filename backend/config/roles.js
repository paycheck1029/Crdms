export const ROLES = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  RECRUITER: 'Recruiter',
  INTERVIEWER: 'Interviewer',
  DATA_ENTRY: 'Data Entry',
  VIEWER: 'Viewer'
};

export const PERMISSIONS = {
  CANDIDATE_VIEW: 'Candidate:View',
  CANDIDATE_CREATE: 'Candidate:Create',
  CANDIDATE_EDIT: 'Candidate:Edit',
  CANDIDATE_DELETE: 'Candidate:Delete',
  CANDIDATE_EXPORT: 'Candidate:Export',
  
  USERS_CREATE: 'Users:Create',
  USERS_DELETE: 'Users:Delete',
  USERS_ROLE_CHANGE: 'Users:Role Change',
  
  REPORTS_VIEW: 'Reports:View',
  REPORTS_EXPORT: 'Reports:Export',
  
  SETTINGS_READ: 'Settings:Read',
  SETTINGS_WRITE: 'Settings:Write'
};

export const ROLES_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.CANDIDATE_VIEW,
    PERMISSIONS.CANDIDATE_CREATE,
    PERMISSIONS.CANDIDATE_EDIT,
    PERMISSIONS.CANDIDATE_DELETE,
    PERMISSIONS.CANDIDATE_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_READ
  ],
  
  [ROLES.RECRUITER]: [
    PERMISSIONS.CANDIDATE_VIEW,
    PERMISSIONS.CANDIDATE_CREATE,
    PERMISSIONS.CANDIDATE_EDIT,
    PERMISSIONS.CANDIDATE_EXPORT,
    PERMISSIONS.REPORTS_VIEW
  ],
  
  [ROLES.INTERVIEWER]: [
    PERMISSIONS.CANDIDATE_VIEW
  ],
  
  [ROLES.DATA_ENTRY]: [
    PERMISSIONS.CANDIDATE_VIEW,
    PERMISSIONS.CANDIDATE_CREATE,
    PERMISSIONS.CANDIDATE_EDIT
  ],
  
  [ROLES.VIEWER]: [
    PERMISSIONS.CANDIDATE_VIEW
  ]
};

export const hasPermission = (userRole, requiredPermission) => {
  const permissions = ROLES_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
};

export default {
  ROLES,
  PERMISSIONS,
  ROLES_PERMISSIONS,
  hasPermission
};
