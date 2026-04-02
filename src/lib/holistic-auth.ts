import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const holisticAuth = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Courriel', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.holisticUser.findUnique({
          where: { email: credentials.email as string },
          include: { practitioner: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          practitionerId: user.practitioner?.id ?? null,
          practitionerStatus: user.practitioner?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.practitionerId = (user as any).practitionerId;
        token.practitionerStatus = (user as any).practitionerStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).practitionerId = token.practitionerId;
        (session.user as any).practitionerStatus = token.practitionerStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: '/soins/auth/login',
    error: '/soins/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const {
  handlers: holisticHandlers,
  auth: holisticSession,
  signIn: holisticSignIn,
  signOut: holisticSignOut,
} = holisticAuth;
