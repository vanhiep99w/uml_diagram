import CredentialsProvider from 'next-auth/providers/credentials';
import { authorizeCredentials } from '@/lib/auth-service';
import type { NextAuthOptions } from 'next-auth';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        return authorizeCredentials({
          email: credentials.email,
          password: credentials.password,
        });
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
};

export default authOptions;
