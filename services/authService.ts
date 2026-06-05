import type { User } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

// NOTE: We store users persistently in Google Cloud Firestore database
const USERS_KEY = 'taxi_app_users';
const CURRENT_USER_KEY = 'taxi_app_current_user';

const getStoredUsers = (): Record<string, Omit<User, 'email'> & { passwordHash: string }> => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch (error) {
    return {};
  }
};

const storeUsers = (users: Record<string, Omit<User, 'email'> & { passwordHash: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Sync users from Firestore to local storage for high availability and offline use
export const syncUsersFromFirestore = async (): Promise<boolean> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const firestoreUsers: Record<string, Omit<User, 'email'> & { passwordHash: string }> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        firestoreUsers[data.email.toLowerCase().trim()] = {
          role: data.role || 'user',
          createdAt: data.createdAt || new Date().toISOString(),
          passwordHash: data.password || data.passwordHash || '',
        };
      }
    });

    const localUsers = getStoredUsers();
    const merged = { ...localUsers, ...firestoreUsers };
    storeUsers(merged);
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar usuários do Firestore:", error);
    return false;
  }
};

// Start background synchronization on library load
syncUsersFromFirestore();

export const register = async (
  email: string, 
  password: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; message: string; user?: User }> => {
  const emailLower = email.toLowerCase().trim();

  if (emailLower === 'admin') {
      return { success: false, message: 'Este nome de usuário é reservado.' };
  }
  
  // Refresh cache before validating
  await syncUsersFromFirestore();
  
  const users = getStoredUsers();
  if (users[emailLower]) {
    return { success: false, message: 'Este e-mail já está cadastrado.' };
  }

  const newUser: User = {
    email: emailLower,
    role: role,
    createdAt: new Date().toISOString(),
  };

  const dbUserData = {
    email: emailLower,
    role: role,
    createdAt: newUser.createdAt,
    password: password,
  };

  try {
    // 1. Persist to Firestore cloud database
    await setDoc(doc(db, 'users', emailLower), dbUserData);

    // 2. Persist to local storage cache
    users[emailLower] = {
      role: newUser.role,
      createdAt: newUser.createdAt,
      passwordHash: password, // Store password plain text in sync with mock logic
    };

    storeUsers(users);
    return { success: true, message: 'Cadastro realizado com sucesso!', user: newUser };
  } catch (error) {
    console.error("Erro ao registrar no Firestore:", error);
    return { success: false, message: 'Erro ao salvar no banco de dados do Firestore.' };
  }
};

export const login = (email: string, password: string): { success: boolean; message: string; user?: User } => {
  const emailLower = email.toLowerCase().trim();
  const users = getStoredUsers();
  const storedUser = users[emailLower];

  // Check for admin account (either cached or default fallback)
  if (emailLower === 'admin') {
    if (storedUser) {
      if (storedUser.passwordHash === password) {
        const adminUser: User = {
          email: 'Admin',
          role: 'admin',
          createdAt: storedUser.createdAt || new Date().toISOString(),
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
        return { success: true, message: 'Login de administrador bem-sucedido!', user: adminUser };
      }
    } else {
      // Default fallback for brand new installs before admin changes their password
      if (password === 'Admin') {
        const adminUser: User = {
          email: 'Admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
        return { success: true, message: 'Login de administrador bem-sucedido!', user: adminUser };
      }
    }
    return { success: false, message: 'Acesso negado. Usuário ou senha incorretos ou não cadastrados.' };
  }

  if (storedUser && storedUser.passwordHash === password) {
    const user: User = {
        email: emailLower,
        role: storedUser.role,
        createdAt: storedUser.createdAt
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, message: 'Login bem-sucedido!', user };
  }

  return { success: false, message: 'Acesso negado. Usuário ou senha incorretos ou não cadastrados.' };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

export const getAllUsers = (): User[] => {
    const users = getStoredUsers();
    return Object.entries(users)
        .filter(([email]) => email.toLowerCase().trim() !== 'admin')
        .map(([email, u]) => ({
            email: email,
            role: u.role,
            createdAt: u.createdAt,
        }));
};

export const updateAdminPassword = async (password: string): Promise<{ success: boolean; message: string }> => {
  const emailLower = 'admin';
  const users = getStoredUsers();

  const newAdminUser: User = {
    email: 'admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  const dbUserData = {
    email: 'admin',
    role: 'admin',
    createdAt: newAdminUser.createdAt,
    password: password,
  };

  try {
    // 1. Persist to Firestore cloud database
    await setDoc(doc(db, 'users', emailLower), dbUserData);

    // 2. Persist to local storage cache
    users[emailLower] = {
      role: 'admin',
      createdAt: newAdminUser.createdAt,
      passwordHash: password,
    };

    storeUsers(users);
    return { success: true, message: 'Senha do Admin alterada com sucesso no Firestore!' };
  } catch (error) {
    console.error("Erro ao atualizar a senha do Admin no Firestore:", error);
    return { success: false, message: 'Erro ao salvar a senha do Admin no Firestore.' };
  }
};

export const deleteUser = async (email: string): Promise<boolean> => {
    const emailLower = email.toLowerCase().trim();
    const users = getStoredUsers();
    
    try {
      // 1. Delete from Firestore cloud database
      await deleteDoc(doc(db, 'users', emailLower));

      // 2. Clear from local storage cache
      if (users[emailLower]) {
          delete users[emailLower];
          storeUsers(users);
      }
      return true;
    } catch (error) {
      console.error("Erro ao deletar do Firestore:", error);
      // Local fallback deletion if database is unreachable
      if (users[emailLower]) {
          delete users[emailLower];
          storeUsers(users);
          return true;
      }
      return false;
    }
};
