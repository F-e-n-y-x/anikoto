import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recently Updated',
};

export default function RecentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
