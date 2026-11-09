export type User = {
  id: string;
  email: string;
  name: string;
};

export type Business = {
  id: string;
  name: string;
  plan?: "FREE" | "PRO";
  role?: "OWNER" | "MANAGER" | "EMPLOYEE";
};

export type AuthResponse = {
  user: User;
  business: Business;
  accessToken: string;
};

export type MeResponse = {
  user: User;
  memberships: Array<{
    businessId: string;
    businessName: string;
    role: "OWNER" | "MANAGER" | "EMPLOYEE";
    plan: "FREE" | "PRO";
  }>;
};