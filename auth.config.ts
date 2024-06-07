import type { NextAuthOptions } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/dashboard',
  },
  callbacks: {

    session({ session }) {
      console.log(session);
      return session;
      // console.log('11111111111111111111111111');
      // const isLoggedIn = !!auth?.user;
      // const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      //
      // if (isOnDashboard) {
      //   console.log('22222222222222222222222222');
      //   return isLoggedIn; // Redirect unauthenticated users to login page
      // } else if (isLoggedIn) {
      //   console.log('333333333333333333333333333333333');
      //   return Response.redirect(new URL('/dashboard', nextUrl));
      // }
      // return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthOptions;

