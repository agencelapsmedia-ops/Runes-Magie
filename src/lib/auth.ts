import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = credentials.password as string;

        // 1) AdminUser (admins du site principal — /admin/login)
        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (admin) {
          const ok = await compare(password, admin.hashedPassword);
          if (!ok) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: "ADMIN",
          };
        }

        // 2) HolisticUser (clients + praticiens inscrits via /soins/auth/register)
        // Le signIn() de next-auth/react tape /api/auth/* par défaut, donc on doit
        // ABSOLUMENT gérer les deux tables ici, sinon les clients ne peuvent jamais se connecter.
        const holistic = await prisma.holisticUser.findUnique({
          where: { email },
          include: { practitioner: true },
        });
        if (!holistic) return null;
        const ok = await compare(password, holistic.hashedPassword);
        if (!ok) return null;
        return {
          id: holistic.id,
          email: holistic.email,
          name: `${holistic.firstName} ${holistic.lastName}`.trim(),
          role: holistic.role, // CLIENT | PRACTITIONER | ADMIN
          practitionerId: holistic.practitioner?.id ?? null,
          practitionerStatus: holistic.practitioner?.status ?? null,
        };
      },
    }),
  ],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.role = u.role;
        token.practitionerId = u.practitionerId ?? null;
        token.practitionerStatus = u.practitionerStatus ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = session.user as any;
        s.id = token.id as string;
        s.role = token.role;
        s.practitionerId = token.practitionerId;
        s.practitionerStatus = token.practitionerStatus;
      }
      return session;
    },
  },
});
