import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user profile from database
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          await supabase.auth.signOut();
        } else {
          setUser(profile);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // First, get user from database to check if exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        toast.error('Username tidak dijumpai atau tidak aktif');
        return false;
      }

      // For demo purposes, we'll use a simple password check
      // In production, you should use proper password hashing
      const expectedPassword = `${username}123`;
      if (password !== expectedPassword) {
        toast.error('Password tidak sah');
        return false;
      }

      // Create a session using Supabase auth with the user's email
      const email = userData.email || `${username}@example.com`;
      
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        // If user doesn't exist in auth, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: userData.username,
              full_name: userData.full_name
            }
          }
        });

        if (signUpError) {
          toast.error('Ralat semasa log masuk');
          return false;
        }

        // Update the user record with the auth ID
        await supabase
          .from('users')
          .update({ id: signUpData.user?.id })
          .eq('username', username);

        setUser({ ...userData, id: signUpData.user?.id || userData.id });
      } else {
        setUser(userData);
      }

      toast.success('Berjaya log masuk!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ralat semasa log masuk');
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Berjaya log keluar');
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error('Ralat semasa kemaskini password');
        return false;
      }

      toast.success('Password berjaya dikemaskini!');
      return true;
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Ralat semasa kemaskini password');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}