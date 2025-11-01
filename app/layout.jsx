import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kids Rhyme Video Maker</title>
        <meta name="description" content="Make a cute kids rhyme video right in your browser." />
      </head>
      <body>{children}</body>
    </html>
  );
}
