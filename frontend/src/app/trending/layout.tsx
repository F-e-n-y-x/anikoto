import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending',
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
