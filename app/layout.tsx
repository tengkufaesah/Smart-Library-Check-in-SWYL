import type {Metadata} from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'Smart Library Check-in',
  description: 'ระบบเช็คอินห้องสมุด โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="th" className={`${prompt.variable}`}>
      <body className="text-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
