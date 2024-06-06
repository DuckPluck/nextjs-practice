import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from '@auth/core/providers/credentials';
import { z } from 'zod';
import axios from 'axios';
import bcrypt from 'bcrypt';


export async function getUser(email: string) {
  try {
    const response = await axios.get(`http://localhost:3001/users?email=${email}`);
    return response.data[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);


        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await getUser(email);

          if (!user) {
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return user;
          }
        }

        console.error('Invalid credentials');
        return null;
      },
  }),
  ],
});
