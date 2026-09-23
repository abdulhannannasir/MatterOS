import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, testFirestoreConnection } from "./config.ts";
import { UserProfile, Organization, UserRole } from "../types/matteros.ts";
import { handleFirestoreError, OperationType } from "./error.ts";
import { OrganizationService, DEMO_ORGANIZATIONS } from "../services/organizationService.ts";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentOrg: Organization | null;
  currentRole: UserRole;
  userOrganizations: Organization[];
  loading: boolean;
  isDemoUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, firm: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemoLawyer: (lawyerRole?: "partner" | "counsel") => void;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  switchUserRole: (role: UserRole, mockUserId?: string, mockName?: string, mockEmail?: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(DEMO_ORGANIZATIONS[0]);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>(DEMO_ORGANIZATIONS);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(true); // Default to true so app starts immediately interactive

  useEffect(() => {
    // Validate connection to Firestore on boot
    testFirestoreConnection();

    const initDemo = () => {
      const mockUser: any = {
        uid: "user-elena-vance",
        email: "elena.vance@vance-sterling.law",
        displayName: "Elena Vance, Esq.",
        emailVerified: true,
        isAnonymous: false,
      };
      setCurrentUser(mockUser);
      setUserProfile({
        id: "user-elena-vance",
        email: "elena.vance@vance-sterling.law",
        displayName: "Elena Vance, Esq.",
        firmName: "Vance & Sterling Global Litigators LLP",
        role: "Managing Senior Partner",
        userRole: "admin",
        organizationId: "demo-org-1",
        createdAt: "2025-01-15T08:00:00Z",
      });
      setCurrentRole("admin");
      setCurrentOrg(DEMO_ORGANIZATIONS[0]);
      setUserOrganizations(DEMO_ORGANIZATIONS);
      setIsDemoUser(true);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoUser(false);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            if (data.userRole) setCurrentRole(data.userRole);
          } else {
            const initialProfile: UserProfile = {
              id: user.uid,
              email: user.email || "counsel@firm.law",
              displayName: user.displayName || user.email?.split("@")[0] || "Legal Counsel",
              firmName: "Vance & Sterling Global Litigators LLP",
              role: "Senior Partner",
              userRole: "admin",
              organizationId: "demo-org-1",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
          const orgs = await OrganizationService.getOrganizations(user.uid, false);
          setUserOrganizations(orgs);
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        } catch (err) {
          console.warn("Could not fetch user profile from Firestore:", err);
          setUserProfile({
            id: user.uid,
            email: user.email || "counsel@firm.law",
            displayName: user.displayName || "Legal Counsel",
            firmName: "Vance & Sterling Global Litigators LLP",
            role: "Partner",
            userRole: "admin",
            organizationId: "demo-org-1",
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
      } else {
        // Fall back to initialized demo user
        initDemo();
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshOrganizations = async () => {
    const orgs = await OrganizationService.getOrganizations(currentUser?.uid || "user-elena-vance", isDemoUser);
    setUserOrganizations(orgs);
    if (currentOrg) {
      const refreshed = orgs.find((o) => o.id === currentOrg.id);
      if (refreshed) setCurrentOrg(refreshed);
    }
  };

  const switchOrganization = async (orgId: string) => {
    const org = userOrganizations.find((o) => o.id === orgId) || (await OrganizationService.getOrganization(orgId, isDemoUser));
    if (org) {
      setCurrentOrg(org);
      if (userProfile) {
        setUserProfile({ ...userProfile, organizationId: org.id });
      }
    }
  };

  const switchUserRole = (
    role: UserRole,
    mockUserId?: string,
    mockName?: string,
    mockEmail?: string
  ) => {
    setCurrentRole(role);
    let id = mockUserId || currentUser?.uid || "user-elena-vance";
    let name = mockName || currentUser?.displayName || "Elena Vance, Esq.";
    let email = mockEmail || currentUser?.email || "elena.vance@vance-sterling.law";
    let title = "Firm Administrator";

    if (!mockUserId) {
      if (role === "admin") {
        id = "user-elena-vance";
        name = "Elena Vance, Esq.";
        email = "elena.vance@vance-sterling.law";
        title = "Managing Senior Partner";
      } else if (role === "lawyer") {
        id = "user-marcus-sterling";
        name = "Marcus Sterling, Esq.";
        email = "marcus.sterling@vance-sterling.law";
        title = "Senior Trial Partner";
      } else if (role === "associate") {
        id = "user-james-chen";
        name = "James Chen, Esq.";
        email = "james.chen@vance-sterling.law";
        title = "Senior Associate Counsel";
      } else if (role === "staff") {
        id = "user-sarah-miller";
        name = "Sarah Miller, CP";
        email = "sarah.miller@vance-sterling.law";
        title = "Head Litigation Paralegal";
      }
    }

    const mockUser: any = {
      uid: id,
      email,
      displayName: name,
      emailVerified: true,
      isAnonymous: false,
    };
    setCurrentUser(mockUser);
    setUserProfile({
      id,
      email,
      displayName: name,
      firmName: currentOrg?.name || "Vance & Sterling Global Litigators LLP",
      role: title,
      userRole: role,
      organizationId: currentOrg?.id || "demo-org-1",
      createdAt: "2025-01-15T08:00:00Z",
    });
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Email login error:", err);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, firm: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateProfile(userCred.user, { displayName: name });
      }
      const initialProfile: UserProfile = {
        id: userCred.user.uid,
        email,
        displayName: name || email.split("@")[0],
        firmName: firm || "Independent Practice",
        role: "Managing Attorney",
        createdAt: new Date().toISOString(),
      };
      const userDocRef = doc(db, "users", userCred.user.uid);
      try {
        await setDoc(userDocRef, initialProfile);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${userCred.user.uid}`);
      }
      setUserProfile(initialProfile);
    } catch (err: any) {
      console.error("Register error:", err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
    await signOut(auth);
  };

  const loginAsDemoLawyer = (lawyerRole: "partner" | "counsel" = "partner") => {
    setIsDemoUser(true);
    const mockUser: any = {
      uid: "demo-user",
      email: lawyerRole === "partner" ? "elena.vance@sterlingvance.law" : "marcus.sterling@sterlingvance.law",
      displayName: lawyerRole === "partner" ? "Elena Vance, Esq." : "Marcus Sterling, Esq.",
      emailVerified: true,
      isAnonymous: false,
    };
    setCurrentUser(mockUser);
    setUserProfile({
      id: "demo-user",
      email: mockUser.email,
      displayName: mockUser.displayName,
      firmName: "Vance & Sterling Global Litigators LLP",
      role: lawyerRole === "partner" ? "Managing Senior Partner" : "Senior Trial Counsel",
      createdAt: "2026-01-01T00:00:00Z",
    });
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...userProfile, ...data } as UserProfile;
    setUserProfile(updated);
    if (!isDemoUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isDemoUser,
        currentOrg,
        currentRole,
        userOrganizations,
        switchOrganization,
        switchUserRole,
        refreshOrganizations,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        loginAsDemoLawyer,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
