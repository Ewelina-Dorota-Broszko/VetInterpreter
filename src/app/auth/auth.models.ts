export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    isVet: boolean;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isVet: boolean;
  ownerId: string;
  createdAt: string;
}
