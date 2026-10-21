import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan kata sandi wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("Email atau kata sandi tidak sesuai");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Email atau kata sandi tidak sesuai");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          currency: user.currency,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.currency = (user as unknown as { currency: string }).currency || "IDR";
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.currency) token.currency = session.currency;
        if (session.image !== undefined) token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.currency = (token.currency as string) || "IDR";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "finkaya-super-secret-key-32-chars-minimum",
};
