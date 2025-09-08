import './globals.css';

export const metadata = {
  title: 'MODA Chat',
  description: 'Conversational RAG over your corpus',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
