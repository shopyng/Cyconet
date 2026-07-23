'use client';

/**
 * styled-jsx style registry.
 *
 * Required by the App Router: without it, styled-jsx rules are generated during
 * the client render only, so the server HTML ships without them and the page
 * flashes unstyled before hydration. `useServerInsertedHTML` flushes the
 * collected rules into <head> ahead of the markup that uses them.
 *
 * Source: next/dist/docs/01-app/02-guides/css-in-js.md
 */

import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { StyleRegistry, createStyleRegistry } from 'styled-jsx';

export default function StyledJsxRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lazy initial state so the registry is created exactly once per render pass.
  const [jsxStyleRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles();
    jsxStyleRegistry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={jsxStyleRegistry}>{children}</StyleRegistry>;
}
