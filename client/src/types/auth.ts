export interface User {
  id: string;
  name: string;
  email: string;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  currentTeamId: string;
  isPlaceholder: boolean;
  isActive: boolean;
  profilePicUrl: string;
  currentTeam: {
    id: string;
    name: string;
  };
  organizations: {
    id: string;
    name: string;
    role: string;
  }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}
