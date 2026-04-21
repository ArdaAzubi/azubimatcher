import './globals.css';

export const metadata = {
  title: 'AzubiMatch Next',
  description: 'Next.js-Frontend fuer AzubiMatch',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}